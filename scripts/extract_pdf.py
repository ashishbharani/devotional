"""Extract the Ultimate Hindu Devotional Collection PDF into structured JSON.

Usage:
    uv run --group extract scripts/extract_pdf.py "path/to/Hindu Devotional Collection.pdf"

Writes:
    data/collection.json      – front matter, library, categories, groups, forms, works
    docs/assets/images/*      – cover art and signature image
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
IMAGES = ROOT / "docs" / "assets" / "images"

WORK_COLOR = 0x1C4B70  # blue work titles
HEADER_Y = (85, 102)  # table header band
FOOTER_Y = 545  # nav buttons start here
COLUMNS = [
    "Language",
    "Form",
    "Tier",
    "Preferred Singer / Recitation",
    "Traditional Purposes",
    "Best Time",
    "Jyotisha",
    "Horoscope Affliction",
]
KEYS = ["language", "form", "tier", "singer", "purposes", "best_time", "jyotisha", "affliction"]


def spans_of(page):
    out = []
    for b in page.get_text("dict")["blocks"]:
        for line in b.get("lines", []):
            for s in line["spans"]:
                if s["text"].strip():
                    out.append(s)
    return out


def rgb_hex(c):
    return "#%02x%02x%02x" % tuple(round(x * 255) for x in c)


def clean(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


# --------------------------------------------------------------------------- front matter


def lines_of(page, y0=60, y1=FOOTER_Y):
    """Group spans into visual lines -> list of dicts (text, bold, size, x0, x1, y)."""
    rows = []
    for b in page.get_text("dict")["blocks"]:
        for line in b.get("lines", []):
            sp = [s for s in line["spans"] if s["text"].strip()]
            if not sp:
                continue
            y = sp[0]["bbox"][1]
            if not (y0 <= y <= y1):
                continue
            rows.append(
                {
                    "text": clean("".join(s["text"] for s in sp)),
                    "bold": all("Bold" in s["font"] for s in sp),
                    "size": round(max(s["size"] for s in sp), 1),
                    "x0": round(sp[0]["bbox"][0]),
                    "x1": round(sp[-1]["bbox"][2]),
                    "y": round(y, 1),
                    "color": "#%06x" % sp[0]["color"],
                }
            )
    rows.sort(key=lambda r: (r["y"], r["x0"]))
    return rows


def extract_front(doc):
    front = {}
    # Foreword (page 2)
    fw = lines_of(doc[1], 60, 575)
    front["foreword"] = fw
    # Disclaimer pages 3-6, legend 7-8, rules 9-10
    front["disclaimer"] = [lines_of(doc[i], 70, 540) for i in range(2, 6)]
    front["legend"] = [lines_of(doc[i], 70, 540) for i in range(6, 8)]
    front["rules"] = [lines_of(doc[i], 70, 540) for i in range(8, 10)]
    return front


def extract_library(doc):
    shelves = []
    for pn in range(10, 13):
        page = doc[pn]
        sp = spans_of(page)
        subtitle = next((clean(s["text"]) for s in sp if 40 < s["bbox"][1] < 70 and s["size"] < 9), "")
        covers = [
            dr
            for dr in page.get_drawings()
            if dr.get("fill") and dr.get("color") and round(dr.get("width") or 0) == 2
        ]
        links = [lk for lk in page.get_links() if lk.get("uri")]
        books = []
        for cv in covers:
            r = cv["rect"]
            title = next(
                clean(s["text"])
                for s in sp
                if s["bbox"][1] > r.y1 and s["bbox"][1] < r.y1 + 40 and abs((s["bbox"][0] + s["bbox"][2]) / 2 - (r.x0 + r.x1) / 2) < 60
            )
            btns = {}
            for lk in links:
                f = lk["from"]
                if f.y0 < r.y1 or f.y0 > r.y1 + 100 or abs(((f.x0 + f.x1) / 2) - (r.x0 + r.x1) / 2) > 110:
                    continue
                label = next(
                    (clean(s["text"]) for s in sp if pymupdf.Rect(s["bbox"]).intersects(f) and s["text"].isupper()),
                    None,
                )
                if label:
                    btns[label.lower()] = lk["uri"]
            books.append({"title": title, "cover": rgb_hex(cv["fill"]), "links": btns})
        shelves.append({"subtitle": subtitle, "books": books})
    return shelves


def extract_categories_index(doc):
    cats = []
    for pn in range(13, 19):
        page = doc[pn]
        sp = spans_of(page)
        boxes = [
            dr
            for dr in page.get_drawings()
            if dr.get("fill") and dr.get("color") and dr["rect"].width > 700 and dr["rect"].y0 > 100
        ]
        for bx in boxes:
            r = bx["rect"]
            inside = [clean(s["text"]) for s in sp if r.y0 <= (s["bbox"][1] + s["bbox"][3]) / 2 <= r.y1]
            num, title, stats = inside[0], inside[1], inside[2]
            m = re.match(r"([\d,]+) works \| ([\d,]+) sections", stats)
            cats.append(
                {
                    "num": int(num),
                    "title": title,
                    "color": rgb_hex(bx["fill"]),
                    "works_stated": int(m.group(1).replace(",", "")),
                    "sections_stated": int(m.group(2).replace(",", "")),
                }
            )
    return cats


# --------------------------------------------------------------------------- data tables


def extract_tables(doc, categories):
    for c in categories:
        c["groups"] = []
    cur_cat = None
    cur_group = None
    cur_form = None

    def new_group(name, sub=""):
        nonlocal cur_group
        cur_group = {"name": name, "subtitle": sub, "forms": [], "page": pn + 1}
        cur_cat["groups"].append(cur_group)

    def new_form(name):
        nonlocal cur_form
        base = re.sub(r"\s*[-–—]\s*CONTINUED$", "", name).strip()
        if cur_group["forms"] and cur_group["forms"][-1]["name"] == base:
            cur_form = cur_group["forms"][-1]
            return
        existing = next((f for f in cur_group["forms"] if f["name"] == base), None)
        if existing is not None and name != base:  # continued elsewhere -> append
            cur_form = existing
            return
        cur_form = {"name": base, "works": []}
        cur_group["forms"].append(cur_form)

    for pn in range(758, len(doc)):
        page = doc[pn]
        sp = spans_of(page)
        title = next(clean(s["text"]) for s in sp if s["bbox"][1] < 45 and "Bold" in s["font"])
        num = int(title.split(".")[0])
        cat = next(c for c in categories if c["num"] == num)
        if cat is not cur_cat:
            cur_cat = cat
            cur_group = cur_form = None
        header = {clean(s["text"]): (s["bbox"][0] + s["bbox"][2]) / 2 for s in sp if HEADER_Y[0] < s["bbox"][1] < HEADER_Y[1]}
        centers = [(header[c], k) for c, k in zip(COLUMNS, KEYS)]

        body = [s for s in sp if HEADER_Y[1] < s["bbox"][1] < FOOTER_Y]
        work_links = sorted(
            [lk for lk in page.get_links() if lk.get("uri") and lk["from"].x0 > 50 and lk["from"].x1 > 200],
            key=lambda lk: lk["from"].y0,
        )
        # headings (bold, centred, ~9.3pt)
        events = []
        for s in body:
            if "Bold" in s["font"] and s["size"] > 8.5:
                events.append(("heading", s["bbox"][1], clean(s["text"]), s))
        for lk in work_links:
            events.append(("row", lk["from"].y0, lk, None))
        events.sort(key=lambda e: e[1])

        for kind, y, obj, s in events:
            if kind == "heading":
                sub = next(
                    (
                        clean(t["text"])
                        for t in body
                        if "Regular" in t["font"]
                        and 6.8 < t["size"] < 7.5
                        and 0 < t["bbox"][1] - s["bbox"][3] < 8
                    ),
                    None,
                )
                if sub is not None:
                    new_group(obj, sub)
                    new_form(sub)
                else:
                    if cur_group is None:
                        new_group(cur_cat["title"])
                    new_form(obj)
                continue
            rect = obj["from"]
            cell = [t for t in body if rect.y0 - 1 <= (t["bbox"][1] + t["bbox"][3]) / 2 <= rect.y1 + 1]
            tl = sorted([t for t in cell if t["color"] == WORK_COLOR], key=lambda t: (t["bbox"][1], t["bbox"][0]))
            title = clean(" ".join(t["text"] for t in tl)) or obj["uri"]
            fields = {k: [] for k in KEYS}
            for t in cell:
                if t["color"] == WORK_COLOR or t["bbox"][0] < 45:
                    continue
                cx = (t["bbox"][0] + t["bbox"][2]) / 2
                key = min(centers, key=lambda c: abs(c[0] - cx))[1]
                fields[key].append((t["bbox"][1], t["bbox"][0], t["text"]))
            work = {"title": title, "url": obj["uri"], "page": pn + 1}
            for k, v in fields.items():
                txt = clean(" ".join(x[2] for x in sorted(v)))
                work[k] = "" if txt in ("—", "-") else txt
            if cur_group is None:
                new_group(cur_cat["title"])
            if cur_form is None:
                new_form(work["form"].upper() or "WORKS")
            cur_form["works"].append(work)
        if pn % 250 == 0:
            print(f"  page {pn + 1}/{len(doc)}", file=sys.stderr)


def extract_images(doc):
    """Cover art as responsive WebP/JPEG sizes + a web-sized signature (needs Pillow)."""
    import io

    from PIL import Image

    IMAGES.mkdir(parents=True, exist_ok=True)
    pix = pymupdf.Pixmap(doc, doc[0].get_images(full=True)[0][0])
    if pix.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    cover = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    for w in (640, 1024, 1491):
        im = cover.resize((w, round(cover.height * w / cover.width)), Image.LANCZOS)
        im.save(IMAGES / f"cover-{w}.webp", quality=80, method=6)
        im.save(IMAGES / f"cover-{w}.jpg", quality=82, optimize=True, progressive=True)

    xref, smask = doc[1].get_images(full=True)[0][:2]
    sig = pymupdf.Pixmap(doc, xref)
    if smask:
        sig = pymupdf.Pixmap(sig, pymupdf.Pixmap(doc, smask))
    im = Image.open(io.BytesIO(sig.tobytes("png")))
    im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    im.save(IMAGES / "signature.png", optimize=True)


def main():
    pdf = Path(sys.argv[1] if len(sys.argv) > 1 else "Hindu Devotional Collection.pdf")
    doc = pymupdf.open(pdf)
    meta = doc.metadata
    print("front matter…", file=sys.stderr)
    front = extract_front(doc)
    library = extract_library(doc)
    categories = extract_categories_index(doc)
    print("tables…", file=sys.stderr)
    extract_tables(doc, categories)
    extract_images(doc)
    out = {
        "title": meta.get("title"),
        "subject": meta.get("subject"),
        "author": meta.get("author"),
        "pages": len(doc),
        "front": front,
        "library": library,
        "categories": categories,
    }
    DATA.mkdir(exist_ok=True)
    (DATA / "collection.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    works = sum(len(f["works"]) for c in categories for g in c["groups"] for f in g["forms"])
    groups = sum(len(c["groups"]) for c in categories)
    print(f"done: {len(categories)} categories, {groups} groups, {works} works", file=sys.stderr)


if __name__ == "__main__":
    main()
