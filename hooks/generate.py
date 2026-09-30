"""MkDocs hook: generate every page of the site from data/collection.json.

Nothing under docs/ needs to be hand-written for the catalogue — the hook
creates virtual pages at build time:

    index.md                              cover / home
    foreword.md, disclaimer.md, legend.md, rules.md
    library.md                            Hindu Scriptures & Books Library
    master-index.md                       Integrated Master Index (42 categories)
    find.md                               full-text work finder
    categories/NN-slug/index.md           category sub-index (groups + forms)
    categories/NN-slug/<group>.md         one table page per deity / group
    assets/works-index.json               compact index used by the finder
"""

from __future__ import annotations

import html
import posixpath
import json
import re
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote_plus

import csv
import logging
import os

from mkdocs.structure.files import File

log = logging.getLogger("mkdocs.hooks.abp")

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "collection.json"
CORRECTIONS_FILE = ROOT / "data" / "corrections.csv"  # community fixes (see CONTRIBUTING.md)
ADDITIONS_FILE = ROOT / "data" / "additions.csv"  # community additions
EDITABLE = {
    "title": "title", "language": "language", "form": "form", "tier": "tier",
    "singer": "singer", "preferred singer": "singer", "recitation": "singer",
    "purposes": "purposes", "traditional purposes": "purposes",
    "best time": "best_time", "best_time": "best_time", "jyotisha": "jyotisha",
    "affliction": "affliction", "horoscope affliction": "affliction",
    "youtube": "url", "url": "url", "link": "url",
}
YT = "https://www.youtube.com/results?search_query="
PART_SIZE = 250  # works per page; bigger groups are split into parts
CONTINUED = re.compile(r"\s*[-–—]\s*CONTINUED\s*$", re.I)

COLUMNS = [
    ("#", "n"),
    ("Works", "w"),
    ("Language", "lang"),
    ("Form", "form"),
    ("Tier", "tier"),
    ("Preferred Singer / Recitation", "singer"),
    ("Traditional Purposes", "purp"),
    ("Best Time", "time"),
    ("Jyotisha", "jyo"),
    ("Horoscope Affliction", "aff"),
]

I18N_TEXT = {
    "Hindu Scriptures & Books Library": "library",
    "Integrated Master Index": "index",
    "Find a Work": "find",
    "Works": "works",
    "Language": "language",
    "Form": "form",
    "Tier": "tier",
    "Found in": "foundIn",
}

_data: dict | None = None
_pages: list[dict] = []  # linear reading order


# --------------------------------------------------------------------------- helpers


def sr(text: str) -> str:
    """Text for screen readers only."""
    return f'<span class="abp-sr">{text}</span>'


def esc(s: str) -> str:
    return html.escape(s or "", quote=True)


def _rgb(h):
    h = h.lstrip("#")
    return [int(h[i : i + 2], 16) for i in (0, 2, 4)]


def _lum(rgb):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

    r, g, b = map(ch, rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrast(a, b):
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def cat_ink(color: str, ratio: float = 4.8) -> str:
    """Darken a category colour until it reads as text (WCAG AA) on its own tinted background."""
    c = _rgb(color)
    paper = _rgb("#fbf6e8")
    bg = [round(c[i] * 0.17 + paper[i] * 0.83) for i in range(3)]
    bg = [round(255 * 0.25 + v * 0.75) for v in bg]  # lighter, glossy top half of bars
    t = 1.0
    while t > 0.2:
        ink = [round(v * t) for v in c]
        if _contrast(ink, bg) >= ratio:
            return "#%02x%02x%02x" % tuple(ink)
        t -= 0.02
    return "#2e241a"


def slugify(s: str) -> str:
    s = s.lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or "section"


def fmt(n: int) -> str:
    return f"{n:,}"


def title_case(s: str) -> str:
    return s if not s.isupper() else s.title().replace("'S", "'s")


def front_matter(**kw) -> str:
    return "---\n" + "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in kw.items()) + "\n---\n\n"


def _read_csv(path: Path):
    """Rows of a community CSV as dicts with lower-case keys; '#' lines and blank lines are ignored."""
    if not path.exists():
        return []
    rows = []
    with path.open(encoding="utf-8-sig", newline="") as fh:
        lines = [ln for ln in fh if ln.strip() and not ln.lstrip().startswith("#")]
    for n, row in enumerate(csv.DictReader(lines), start=2):
        clean = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        if any(clean.values()):
            clean["_line"] = n
            rows.append(clean)
    return rows


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().casefold()


def apply_community_edits(cat: dict, merged: "OrderedDict[str, dict]", report: dict) -> None:
    """Apply data/corrections.csv and data/additions.csv to one category (before pages are built)."""
    num = str(cat["num"])
    # ---- corrections: category, group (optional), title, field, new value
    for row in report["corrections"]:
        if row.get("category", "").split(".")[0].strip() != num:
            continue
        where = f'corrections.csv line {row["_line"]}'
        field = _norm(row.get("field", ""))
        title = _norm(row.get("title", ""))
        group = _norm(row.get("group", ""))
        new = row.get("new value", row.get("new_value", ""))
        if not title or not field:
            log.warning(f"{where}: needs at least a title and a field")
            continue
        if field not in EDITABLE and field not in ("delete", "remove"):
            log.warning(f"{where}: unknown field '{row.get('field')}'. Use one of: {', '.join(sorted(set(EDITABLE)))} or delete")
            continue
        hits = 0
        for g in merged.values():
            if group and _norm(g["name"]) != group:
                continue
            for form, works in g["forms"].items():
                for w in list(works):
                    if _norm(w["title"]) != title:
                        continue
                    hits += 1
                    if field in ("delete", "remove"):
                        works.remove(w)
                        continue
                    key = EDITABLE[field]
                    if key == "title":
                        if w["url"] == YT + quote_plus(w["title"]):
                            w["url"] = YT + quote_plus(new)
                        w["title"] = new
                    elif key == "tier" and new and new.upper() not in ("T1", "T2", "T3", "T4"):
                        log.warning(f"{where}: tier must be T1, T2, T3 or T4 (got '{new}')")
                    elif key == "url" and new and not new.startswith(("https://", "http://")):
                        log.warning(f"{where}: the link must start with https://")
                    else:
                        w[key] = new.upper() if key == "tier" else new
        if hits:
            report["applied"] += 1
        else:
            log.warning(f"{where}: no work titled '{row.get('title')}' found in category {num}"
                        + (f" / group '{row.get('group')}'" if group else "") + " (check the spelling)")

    # ---- additions: category, group, form, title, language, tier, singer, purposes, best time, jyotisha, affliction, youtube
    for row in report["additions"]:
        if row.get("category", "").split(".")[0].strip() != num:
            continue
        where = f'additions.csv line {row["_line"]}'
        title, gname, fname = row.get("title", ""), row.get("group", ""), row.get("form", "")
        if not (title and gname and fname):
            log.warning(f"{where}: category, group, form and title are required")
            continue
        g = next((g for g in merged.values() if _norm(g["name"]) == _norm(gname)), None)
        if g is None:
            g = merged.setdefault(gname.upper(), {"name": gname.upper(), "page": 0, "forms": OrderedDict()})
            log.info(f"{where}: new group '{gname.upper()}' created in category {num}")
        fkey = next((k for k in g["forms"] if _norm(k) == _norm(fname)), fname.upper())
        tier = (row.get("tier") or "T2").upper()
        if tier not in ("T1", "T2", "T3", "T4"):
            log.warning(f"{where}: tier must be T1, T2, T3 or T4 (got '{row.get('tier')}')")
            continue
        url = row.get("youtube") or row.get("url") or YT + quote_plus(title)
        g["forms"].setdefault(fkey, []).append({
            "title": title, "url": url, "page": 0,
            "language": row.get("language", ""), "form": row.get("form", "").title(), "tier": tier,
            "singer": row.get("singer", row.get("preferred singer", "")),
            "purposes": row.get("purposes", row.get("traditional purposes", "")),
            "best_time": row.get("best time", row.get("best_time", "")),
            "jyotisha": row.get("jyotisha", ""), "affliction": row.get("affliction", row.get("horoscope affliction", "")),
        })
        report["added"] += 1


def _summary(report: dict) -> None:
    msg = f"Community edits: {report['applied']} correction(s) applied, {report['added']} work(s) added."
    log.info(msg)
    step = os.environ.get("GITHUB_STEP_SUMMARY")
    if step:
        with open(step, "a", encoding="utf-8") as fh:
            fh.write(f"### {msg}\n")


def load():
    global _data
    if _data is None:
        _data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        report = {"corrections": _read_csv(CORRECTIONS_FILE), "additions": _read_csv(ADDITIONS_FILE), "applied": 0, "added": 0}
        known = {str(c["num"]) for c in _data["categories"]}
        for name in ("corrections", "additions"):
            for row in report[name]:
                if row.get("category", "").split(".")[0].strip() not in known:
                    log.warning(f'{name}.csv line {row["_line"]}: category must be a number from 1 to 42 (got "{row.get("category")}")')
        for cat in _data["categories"]:
            merged: OrderedDict[str, dict] = OrderedDict()
            for g in cat["groups"]:
                tgt = merged.setdefault(g["name"], {"name": g["name"], "page": g["page"], "forms": OrderedDict()})
                for f in g["forms"]:
                    base = CONTINUED.sub("", f["name"]).strip()
                    tgt["forms"].setdefault(base, []).extend(f["works"])
            apply_community_edits(cat, merged, report)
            used = set()
            groups = []
            for g in merged.values():
                slug = slugify(g["name"])
                base, i = slug, 2
                while slug in used or slug == "index":
                    slug, i = f"{base}-{i}", i + 1
                used.add(slug)
                # headings with no rows (e.g. a super-heading like "SACRED RIVER DEITIES") are dropped
                forms = [{"name": k, "anchor": slugify(k), "works": v} for k, v in g["forms"].items() if v]
                if not forms:
                    continue
                group = {
                    "name": g["name"],
                    "slug": slug,
                    "page": g["page"],
                    "forms": forms,
                    "count": sum(len(f["works"]) for f in forms),
                }
                groups.append(group)
            cat["merged"] = groups
            cat["works_stated"] = sum(g["count"] for g in groups)  # live count (includes community edits)
            cat["slug"] = f"{cat['num']:02d}-{slugify(cat['title'])}"
            cat["dir"] = f"categories/{cat['slug']}"
            cat["url"] = cat["dir"] + "/"
            for group in groups:
                split_parts(cat, group)
        _summary(report)
    return _data


def split_parts(cat: dict, g: dict) -> None:
    """Split very large groups into pages of ~PART_SIZE works so phones stay fast.

    A form that crosses a page boundary continues on the next page, exactly like the
    "— CONTINUED" headings of the PDF. Part 1 keeps the group URL; later parts live at
    <group>/part-N/.
    """
    parts, cur, count, n = [], None, 0, 0
    for f in g["forms"]:
        works, i, first = f["works"], 0, True
        while i < len(works):
            remaining = len(works) - i
            if cur is None or count >= PART_SIZE:
                cur, count = {"forms": [], "start": n}, 0
                parts.append(cur)
            take = remaining if count + remaining <= PART_SIZE * 1.25 else PART_SIZE - count
            cur["forms"].append({"name": f["name"], "anchor": f["anchor"], "works": works[i : i + take],
                                 "start": n, "continued": not first})
            if first:
                f["part"] = len(parts)
            n, i, count, first = n + take, i + take, count + take, False
    for k, part in enumerate(parts, 1):
        part["num"] = k
        part["src"] = f'{cat["dir"]}/{g["slug"]}.md' if k == 1 else f'{cat["dir"]}/{g["slug"]}/part-{k}.md'
        part["url"] = url_of(part["src"])
        part["count"] = sum(len(f["works"]) for f in part["forms"])
    for f in g["forms"]:
        f["url"] = parts[f["part"] - 1]["url"]
    g["parts"] = parts
    g["url"] = parts[0]["url"]


def rel(from_url: str, to_url: str) -> str:
    """Relative link between two directory-style site URLs (raw HTML is not rewritten by MkDocs)."""
    r = posixpath.relpath("/" + to_url, "/" + from_url)
    return "./" if r == "." else r.rstrip("/") + "/"


def url_of(src: str) -> str:
    """docs-relative src path -> site-relative directory URL."""
    if src == "index.md":
        return ""
    if src.endswith("/index.md"):
        return src[: -len("index.md")]
    return src[:-3] + "/"


# --------------------------------------------------------------------------- page builders


def i18n_attr(text: str, name: str = "data-i18n") -> str:
    """Translation marker for interface labels that have a native language equivalent."""
    key = I18N_TEXT.get(text)
    return f' {name}="{key}"' if key else ""


def titlebar(title: str, subtitle: str = "", kind: str = "", level: int = 1) -> str:
    sub = f'<p class="abp-titlebar__sub">{esc(subtitle)}</p>' if subtitle else ""
    focus = ' tabindex="-1"' if level == 1 else ""
    tag = "header" if level == 1 else "div"
    i18n = i18n_attr(title)
    return f'<{tag} class="abp-titlebar {kind}" markdown="0"><h{level}{focus} class="abp-titlebar__h"{i18n}>{esc(title)}</h{level}>{sub}</{tag}>\n\n'


def paragraphs(lines):
    """Merge visual lines into paragraphs using the vertical gap."""
    paras, cur, last = [], None, None
    for ln in lines:
        gap = (ln["y"] - last["y"]) if last else 99
        same = last and gap / max(ln["size"], 1) < 1.35 and ln["bold"] == last["bold"]
        if same:
            cur["text"] += " " + ln["text"]
            cur["x1"] = max(cur["x1"], ln["x1"])
        else:
            cur = dict(ln)
            paras.append(cur)
        last = ln
    return paras


def page_foreword(d):
    lines = d["front"]["foreword"]
    head, body = lines[0], lines[1:]
    box = [ln for ln in body if ln["bold"] and ln["y"] > 500]
    body = [ln for ln in body if ln not in box]
    out = ['<article class="abp-foreword" markdown="0">']
    out.append('<header class="abp-foreword__band"><h1 tabindex="-1" data-i18n="foreword">FOREWORD</h1><p>HINDU DEVOTIONAL LIBRARY</p></header>')
    out.append(f'<h2 class="abp-foreword__dedication">{esc(head["text"])}</h2>')
    out.append('<div class="abp-foreword__body">')
    for p in paragraphs(body):
        centred = p["x0"] > 150 and p["bold"]
        indent = p["x0"] > 150 and not p["bold"]
        cls = "abp-foreword__motto" if centred else ("abp-foreword__indent" if indent else "")
        out.append(f'<p class="{cls}">{esc(p["text"])}</p>')
    out.append("</div>")
    out.append('<div class="abp-foreword__box">' + "".join(f"<p>{esc(b['text'])}</p>" for b in box) + "</div>")
    out.append('<img class="abp-foreword__sign" src="../assets/images/signature.png" width="720" height="240" loading="lazy" decoding="async" alt="Signature — Advocate Ashish Bharani">')
    out.append("</article>")
    return "\n".join(out)


def render_notice_pages(pages):
    out = []
    for lines in pages:
        paras = paragraphs(lines)
        in_contact = False
        for p in paras:
            t = p["text"]
            if p["bold"] and t.isupper():
                in_contact = t == "CONTACT"
                out.append(f'<h2 class="abp-bar{" abp-bar--center" if in_contact else ""}">{esc(t)}</h2>')
            elif in_contact:
                # contact lines are single-spaced; split them back into lines
                pass
            else:
                out.append(f"<p>{esc(t)}</p>")
        if any(ln["text"] == "CONTACT" for ln in lines):
            idx = next(i for i, ln in enumerate(lines) if ln["text"] == "CONTACT")
            contact = [ln["text"] for ln in lines[idx + 1 :]]
            name, rest = contact[0], contact[1:]
            items = []
            for ln in rest:
                m = re.search(r"[\w.+-]+@[\w.-]+", ln)
                if m:
                    ln = esc(ln).replace(m.group(0), f'<a href="mailto:{m.group(0)}">{m.group(0)}</a>')
                else:
                    ln = esc(ln)
                items.append(ln)
            out.append(
                '<address class="abp-contact"><strong>' + esc(name) + "</strong><br>" + "<br>".join(items) + "</address>"
            )
    return out


def page_disclaimer(d):
    body = "\n".join(render_notice_pages(d["front"]["disclaimer"]))
    return titlebar("Important Disclaimer & Terms of Access", "Please read before using this publication") + (
        f'<div class="abp-notice" markdown="0">\n{body}\n</div>\n'
    )


def numbered_items(lines):
    digits = [ln for ln in lines if ln["text"].isdigit() and ln["bold"]]
    items = []
    for i, dg in enumerate(digits):
        y0 = dg["y"] - 12
        y1 = digits[i + 1]["y"] - 12 if i + 1 < len(digits) else 10_000
        region = [ln for ln in lines if y0 <= ln["y"] < y1 and ln is not dg]
        heading = " ".join(ln["text"] for ln in region if ln["bold"])
        text = " ".join(ln["text"] for ln in region if not ln["bold"])
        items.append((dg["text"], heading, text))
    return items


def page_legend(d):
    items = [it for pg in d["front"]["legend"] for it in numbered_items(pg)]
    cards = "\n".join(
        f'<div class="abp-card"><span class="abp-card__num" aria-hidden="true">{n}</span>{sr(f"Note {n}: ")}<div><h2 class="abp-card__title">{esc(h)}</h2><p>{esc(t)}</p></div></div>'
        for n, h, t in items
    )
    return titlebar("Legend — Publication Method", f"Guide · {len(items)} notes", "abp-titlebar--sand") + (
        f'<div class="abp-cards" markdown="0">\n{cards}\n</div>\n'
    )


def page_rules(d):
    items = [it for pg in d["front"]["rules"] for it in numbered_items(pg)]
    cards = "\n".join(
        f'<div class="abp-card abp-card--rule"><span class="abp-card__num" aria-hidden="true">{n}</span><div><p>{sr(f"Rule {n}: ")}{esc(t)}</p></div></div>'
        for n, h, t in items
    )
    return titlebar("Final Reconciliation Rules Applied", f"Rules 1–{len(items)}", "abp-titlebar--sage") + (
        f'<div class="abp-cards" markdown="0">\n{cards}\n</div>\n'
    )


def page_library(d):
    out = [titlebar("Hindu Scriptures & Books Library", "Epics · Vedas · Upanishads · Puranas · Darshana", "abp-titlebar--slate")]
    for shelf in d["library"]:
        out.append(f'<h2 class="abp-shelf">{esc(shelf["subtitle"].title().replace("•", "·"))}</h2>\n')
        cards = []
        for b in shelf["books"]:
            names = {"open": "Open {t}", "english": "{t} in English", "hindi": "{t} in Hindi", "listen": "Listen to {t} on YouTube"}
            btns = "".join(
                f'<a class="abp-btn" href="{esc(b["links"][k])}" target="_blank" rel="noopener" '
                f'aria-label="{esc(names[k].format(t=b["title"]))} (opens in a new tab)">{k.upper()}</a>'
                for k in ("open", "english", "hindi", "listen")
                if k in b["links"]
            )
            cards.append(
                f'<div class="abp-book"><div class="abp-book__cover" aria-hidden="true" style="--cover:{b["cover"]}">'
                f'<span>SACRED TEXT</span><i></i></div><h3>{esc(b["title"])}</h3>'
                f'<div class="abp-book__btns">{btns}</div></div>'
            )
        out.append('<div class="abp-books" markdown="0">\n' + "\n".join(cards) + "\n</div>\n")
    return "\n".join(out)


def category_bars(d, prefix=""):
    rows = []
    for c in d["categories"]:
        rows.append(
            f'<a class="abp-catbar" style="--abp-cat:{c["color"]};--abp-cat-ink:{cat_ink(c["color"])}" href="{prefix}{c["dir"]}/">'
            f'<span class="abp-catbar__num">{c["num"]}<span class="abp-sr">.</span></span>'
            f'<span class="abp-catbar__title">{esc(c["title"])}</span>'
            f'<span class="abp-catbar__stats"><span class="abp-sr">, </span>{fmt(c["works_stated"])} <span data-i18n="works">works</span> <span aria-hidden="true">|</span><span class="abp-sr">,</span> {fmt(c["sections_stated"])} <span data-i18n="sections">sections</span></span></a>'
        )
    return '<nav class="abp-catbars" markdown="0" aria-label="42 categories">\n' + "\n".join(rows) + "\n</nav>\n"


def page_master(d):
    total = sum(c["works_stated"] for c in d["categories"])
    return (
        titlebar("Integrated Master Index", f"42 categories · {fmt(total)} works", "abp-titlebar--plum")
        + '<div class="abp-offline" data-pack="all" markdown="0" hidden></div>\n'
        + category_bars(d, "../")
    )


def page_home(d):
    total = sum(c["works_stated"] for c in d["categories"])
    groups = sum(len(c["merged"]) for c in d["categories"])
    return (
        '<h1 class="abp-sr" tabindex="-1">Ultimate Hindu Devotional Collection</h1>\n'
        '<section class="abp-cover" markdown="0" aria-label="Cover">\n'
        "<picture>"
        '<source type="image/webp" sizes="(min-width: 90rem) 1400px, 100vw" '
        'srcset="assets/images/cover-640.webp 640w, assets/images/cover-1024.webp 1024w, assets/images/cover-1491.webp 1491w">'
        '<img src="assets/images/cover-1024.jpg" sizes="(min-width: 90rem) 1400px, 100vw" '
        'srcset="assets/images/cover-640.jpg 640w, assets/images/cover-1024.jpg 1024w, assets/images/cover-1491.jpg 1491w" '
        'width="1491" height="1055" fetchpriority="high" decoding="async" '
        'alt="Ultimate Hindu Devotional Collection — a pan-India multilingual devotional reference, collected and compiled by Advocate Ashish Bharani">'
        "</picture>\n"
        '<a class="abp-cover__hot abp-cover__hot--left" href="library/" title="Scriptures &amp; Books Library" data-i18n-title="library"><span data-i18n="library">Scriptures &amp; Books Library</span></a>\n'
        '<a class="abp-cover__hot abp-cover__hot--right" href="master-index/" title="Integrated Master Index" data-i18n-title="index"><span data-i18n="index">Integrated Master Index</span></a>\n'
        "</section>\n\n"
        '<ul class="abp-stats" markdown="0" aria-label="The collection in numbers">'
        f'<li><b>{fmt(total)}</b> <span data-i18n="works">works</span></li>'
        f'<li><b>42</b> <span data-i18n="categories">categories</span></li>'
        f"<li><b>{fmt(groups)}</b> <span>deities, traditions &amp; groups</span></li>"
        f'<li><b>{fmt(d["pages"])}</b> <span>pages in the PDF edition</span></li>'
        "</ul>\n\n"
        '<div id="abp-install" class="abp-install" markdown="0" hidden></div>\n\n'
        '<nav class="abp-home-links" markdown="0" aria-label="Main sections">'
        '<a class="abp-btn abp-btn--big" href="foreword/" data-i18n="foreword">Foreword</a>'
        '<a class="abp-btn abp-btn--big" href="library/" data-i18n="library">Scriptures &amp; Books Library</a>'
        '<a class="abp-btn abp-btn--big" href="master-index/" data-i18n="index">Integrated Master Index</a>'
        '<a class="abp-btn abp-btn--big" href="find/" data-i18n="find">Find a Work</a>'
        "</nav>\n\n"
        + titlebar("Integrated Master Index", "Choose a category", "abp-titlebar--plum", level=2)
        + category_bars(d)
    )


def page_category(c):
    out = [titlebar(f"{c['num']}. {c['title']}", "Sections and deity subsections", "abp-titlebar--cat")]
    out.append(
        f'<p class="abp-lede" markdown="0">{fmt(c["works_stated"])} <span data-i18n="works">works</span> · {fmt(len(c["merged"]))} groups · '
        f'{fmt(c["sections_stated"])} <span data-i18n="sections">sections</span></p>\n'
    )
    out.append(f'<div class="abp-offline" data-pack="{c["num"]}" markdown="0" hidden></div>\n')
    out.append('<div class="abp-subindex" markdown="0">')
    for g in c["merged"]:
        chips = "".join(
            f'<a href="{rel(c["url"], f["url"])}#{f["anchor"]}">{esc(f["name"])}'
            f'<small><span class="abp-sr">, </span>{len(f["works"])}<span class="abp-sr"> {"work" if len(f["works"]) == 1 else "works"}</span></small></a>'
            for f in g["forms"]
        )
        parts = f' · {len(g["parts"])} pages' if len(g["parts"]) > 1 else ""
        out.append(
            f'<section class="abp-group"><h2 class="abp-group__h"><a class="abp-group__bar" href="{rel(c["url"], g["url"])}">'
            f'<span>{esc(g["name"])}</span><small><span class="abp-sr">, </span>{fmt(g["count"])} works{parts}</small></a></h2>'
            f'<nav class="abp-group__forms" aria-label="Forms of {esc(g["name"])}">{chips}</nav></section>'
        )
    out.append("</div>\n")
    return "\n".join(out)


SR_HEAD = (
    '<thead class="abp-sr-head"><tr>'
    + "".join(f'<th scope="col"{i18n_attr(h)}>{"Number" if h == "#" else html.escape(h)}</th>' for h, _ in COLUMNS)
    + "</tr></thead>"
)

COLGROUP = (
    '<colgroup><col class="c-n"><col class="c-w"><col class="c-lang"><col class="c-form"><col class="c-tier">'
    '<col class="c-singer"><col class="c-purp"><col class="c-time"><col class="c-jyo"><col class="c-aff"></colgroup>'
)


def cell(v: str, cls: str, label: str) -> str:
    i18n = i18n_attr(label, "data-i18n-label")
    if not v:
        return f'<td class="{cls} is-empty" data-label="{label}"{i18n}>—</td>'
    return f'<td class="{cls}" data-label="{label}"{i18n}>{esc(v)}</td>'


def part_nav(g, part, where="top") -> str:
    if len(g["parts"]) == 1:
        return ""
    links = []
    for p in g["parts"]:
        label = f'{p["num"]}'
        if p is part:
            links.append(f'<span class="abp-parts__cur" aria-current="page"><span class="abp-sr">Page </span>{label}</span>')
        else:
            links.append(f'<a href="{rel(part["url"], p["url"])}"><span class="abp-sr">Page </span>{label}</a>')
    label = "Pages of this section" + (" (bottom)" if where == "bottom" else "")
    return f'<nav class="abp-parts" markdown="0" aria-label="{label}"><span aria-hidden="true">Page</span>{"".join(links)}</nav>\n'


def page_group(c, g, part):
    out = [titlebar(f"{c['num']}. {c['title']}", "", "abp-titlebar--cat")]
    head = "".join(f'<th class="{k}"{i18n_attr(h)}>{esc(h)}</th>' for h, k in COLUMNS)
    first, last = part["start"] + 1, part["start"] + part["count"]
    info = f'{fmt(g["count"])} works · {len(g["forms"])} forms'
    if len(g["parts"]) > 1:
        info = f'Page {part["num"]} of {len(g["parts"])} · works {fmt(first)}–{fmt(last)} of {fmt(g["count"])} · {len(g["forms"])} forms'
    out.append(
        f'<div class="abp-sheet abp-sheet--head" markdown="0" aria-hidden="true" data-search-exclude><table class="abp-table abp-table--head" role="presentation">{COLGROUP}'
        f"<thead><tr>{head}</tr></thead></table></div>\n"
        f'<div class="abp-groupbar" markdown="0"><h2>{esc(g["name"])}</h2><p>{info}</p></div>\n'
    )
    out.append(part_nav(g, part))
    if len(g["forms"]) > 1:
        here = {f["name"] for f in part["forms"]}
        chips = []
        for f in g["forms"]:
            href = ("" if f["url"] == part["url"] else rel(part["url"], f["url"])) + "#" + f["anchor"]
            cls = ' class="is-here"' if f["name"] in here else ""
            n_works = len(f["works"])
            chips.append(
                f'<a href="{href}"{cls}>{esc(f["name"])}<small><span class="abp-sr">, </span>{n_works}'
                f'<span class="abp-sr"> {"work" if n_works == 1 else "works"}</span></small></a>'
            )
        chips = "".join(chips)
        out.append(
            f'<details class="abp-jumpbox" open markdown="0"><summary>Jump to a form ({len(g["forms"])})</summary>'
            f'<nav class="abp-jump" aria-label="Forms in this section">{chips}</nav></details>\n'
        )
    for f in part["forms"]:
        name = f["name"] + (" — CONTINUED" if f["continued"] else "")
        out.append(f'\n### {name} {{ #{f["anchor"]} .abp-formbar }}\n')
        rows = []
        for n, w in enumerate(f["works"], f["start"] + 1):
            rows.append(
                "<tr>"
                f'<td class="n">{n}</td>'
                f'<th scope="row" class="w"><a href="{esc(w["url"])}" target="_blank" rel="noopener" title="Search YouTube for this work">'
                f'<span class="abp-play" aria-hidden="true"></span>{esc(w["title"])}</a></th>'
                + cell(w["language"], "lang", "Language")
                + cell(w["form"], "form", "Form")
                + f'<td class="tier" data-label="Tier" data-i18n-label="tier"><span class="abp-tier abp-tier--{esc(w["tier"].lower())}">{esc(w["tier"] or "—")}</span></td>'
                + cell(w["singer"], "singer", "Preferred Singer / Recitation")
                + cell(w["purposes"], "purp", "Traditional Purposes")
                + cell(w["best_time"], "time", "Best Time")
                + cell(w["jyotisha"], "jyo", "Jyotisha")
                + cell(w["affliction"], "aff", "Horoscope Affliction")
                + "</tr>"
            )
        out.append(
            f'<div class="abp-sheet abp-sheet--body" style="--rows:{len(f["works"])}" markdown="0">'
            f'<table class="abp-table" role="table" data-search-exclude>'
            f'<caption class="abp-sr">{esc(g["name"])} — {esc(name)}, {len(f["works"])} {"work" if len(f["works"]) == 1 else "works"}</caption>'
            f'{COLGROUP}{SR_HEAD}<tbody>\n'
            + "\n".join(rows)
            + "\n</tbody></table></div>\n"
        )
    out.append(part_nav(g, part, "bottom"))
    out.append('<p id="abp-yt-desc" class="abp-sr" markdown="0">Opens a YouTube search for this work in a new tab.</p>\n')
    return "\n".join(out)


def page_offline(d):
    cats = {c["dir"] + "/": f'{c["num"]}. {title_case(c["title"])}' for c in d["categories"]}
    return titlebar("You're offline", "Saved pages are still available", "abp-titlebar--sand") + (
        '<div class="abp-offline-page" markdown="0">\n'
        "<p>This page isn't saved on this device yet, so it can't be shown without an internet connection.</p>\n"
        "<p>Everything you have opened before, and every category you saved with <b>Save for offline</b>, "
        "still works. Pick one below, or try again when you're back online.</p>\n"
        '<p class="abp-home-links"><a class="abp-btn abp-btn--big" href="../" data-i18n="home">Home</a>'
        '<a class="abp-btn abp-btn--big" href="../master-index/" data-i18n="index">Integrated Master Index</a>'
        '<a class="abp-btn abp-btn--big" href="../find/" data-i18n="find">Find a Work</a>'
        '<button type="button" class="abp-btn abp-btn--big" onclick="var f=new URLSearchParams(location.search).get(&quot;from&quot;);location.href=f||location.href">Try again</button></p>\n'
        f"<div id=\"abp-saved\" data-cats='{esc(json.dumps(cats, ensure_ascii=False))}'></div>\n"
        "</div>\n"
    )


def page_find(d):
    opts = "".join(f'<option value="{c["num"]}">{c["num"]}. {esc(title_case(c["title"]))}</option>' for c in d["categories"])
    return titlebar("Find a Work", "Search all works by title, language, form or tier", "abp-titlebar--slate") + (
        '<div class="abp-finder" markdown="0" data-index="../assets/works-index.json">\n'
        '<div class="abp-finder__controls">'
        '<input type="search" id="abp-q" inputmode="search" enterkeyhint="search" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Search works" placeholder="Type a title, e.g. Hanuman Chalisa, Ganesha Ashtakam…" autocomplete="off">'
        f'<select id="abp-cat" aria-label="Category"><option value="" data-i18n-all="categories">All categories</option>{opts}</select>'
        '<select id="abp-lang" aria-label="Language"><option value="" data-i18n-all="language">All languages</option></select>'
        '<select id="abp-tier" aria-label="Tier"><option value="" data-i18n-all="tier">All tiers</option><option>T1</option><option>T2</option><option>T3</option><option>T4</option></select>'
        "</div>\n"
        '<p class="abp-finder__status" id="abp-status" role="status" aria-live="polite" data-i18n="loading">Loading index…</p>\n'
        '<div class="abp-sheet"><table class="abp-table abp-table--finder" role="table"><caption class="abp-sr">Search results</caption>'
        '<thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col" class="n">Number</th><th role="columnheader" scope="col" class="w" data-i18n="works">Works</th>'
        '<th role="columnheader" scope="col" class="lang" data-i18n="language">Language</th><th role="columnheader" scope="col" class="form" data-i18n="form">Form</th>'
        '<th role="columnheader" scope="col" class="tier" data-i18n="tier">Tier</th><th role="columnheader" scope="col" class="where" data-i18n="foundIn">Found in</th></tr></thead>'
        '<tbody id="abp-results" role="rowgroup"></tbody></table></div>\n'
        '<p class="abp-finder__more"><button type="button" class="abp-btn abp-btn--big" id="abp-more" data-i18n="showMore" hidden>Show more results</button></p>\n'
        "</div>\n"
    )


def works_index(d) -> str:
    """Compact finder index: shared lookup tables + one short array per work."""
    langs, forms, places = [], [], []
    li, fi, pi = {}, {}, {}
    rows = []
    for c in d["categories"]:
        for g in c["merged"]:
          for part in g["parts"]:
            for f in part["forms"]:
                key = f'{part["url"]}#{f["anchor"]}'
                if key not in pi:
                    pi[key] = len(places)
                    places.append([key, c["num"], f"{g['name']} › {f['name']}"])
                for w in f["works"]:
                    if w["language"] not in li:
                        li[w["language"]] = len(langs)
                        langs.append(w["language"])
                    if w["form"] not in fi:
                        fi[w["form"]] = len(forms)
                        forms.append(w["form"])
                    url = 0 if w["url"] == YT + quote_plus(w["title"]) else w["url"]
                    rows.append([w["title"], url, li[w["language"]], fi[w["form"]], w["tier"], pi[key]])
    return json.dumps({"langs": langs, "forms": forms, "places": places, "works": rows}, ensure_ascii=False, separators=(",", ":"))


# --------------------------------------------------------------------------- mkdocs events


def on_config(config, **kw):
    d = load()
    _pages.clear()

    def add(src, title, section, **meta):
        _pages.append({"src": src, "title": title, "section": section, **meta})

    add("index.md", "Home", "front")
    add("foreword.md", "Foreword", "front")
    add("disclaimer.md", "Disclaimer & Terms of Access", "front")
    add("legend.md", "Legend", "front")
    add("rules.md", "Final Reconciliation Rules Applied", "front")
    add("library.md", "Hindu Scriptures & Books Library", "front")
    add("master-index.md", "Integrated Master Index", "front")
    for c in d["categories"]:
        add(f'{c["dir"]}/index.md', f'{c["num"]}. {title_case(c["title"])}', c["num"], cat=c)
        for g in c["merged"]:
            for part in g["parts"]:
                title = g["name"] if len(g["parts"]) == 1 else f'{g["name"]} (page {part["num"]} of {len(g["parts"])})'
                add(part["src"], title, c["num"], cat=c, group=g, part=part)
    add("find.md", "Find a Work", "tools")

    config["nav"] = [
        {"Home": "index.md"},
        {
            "About this Collection": [
                {"Foreword": "foreword.md"},
                {"Disclaimer & Terms": "disclaimer.md"},
                {"Legend": "legend.md"},
                {"Reconciliation Rules": "rules.md"},
            ]
        },
        {"Scriptures & Books Library": "library.md"},
        {
            "Integrated Master Index": [{"All 42 categories": "master-index.md"}]
            + [{f'{c["num"]}. {title_case(c["title"])}': f'{c["dir"]}/index.md'} for c in d["categories"]]
        },
        {"Find a Work": "find.md"},
    ]
    return config


def on_files(files, config, **kw):
    d = load()
    builders = {
        "index.md": lambda p: page_home(d),
        "foreword.md": lambda p: page_foreword(d),
        "disclaimer.md": lambda p: page_disclaimer(d),
        "legend.md": lambda p: page_legend(d),
        "rules.md": lambda p: page_rules(d),
        "library.md": lambda p: page_library(d),
        "master-index.md": lambda p: page_master(d),
        "find.md": lambda p: page_find(d),
    }
    sections = []
    for p in _pages:
        if not sections or sections[-1][0] != p["section"]:
            sections.append((p["section"], p))
    sec_first = {s: p for s, p in sections}
    sec_order = [s for s, _ in sections]

    for i, p in enumerate(_pages):
        src = p["src"]
        if files.get_file_from_path(src):
            continue  # a hand-written page overrides the generated one
        if "group" in p:
            body = page_group(p["cat"], p["group"], p["part"])
        elif "cat" in p:
            body = page_category(p["cat"])
        else:
            body = builders[src](p)
        si = sec_order.index(p["section"])
        meta = {
            "title": p["title"],
            "abp_prev": url_of(_pages[i - 1]["src"]) if i > 0 else None,
            "abp_next": url_of(_pages[i + 1]["src"]) if i + 1 < len(_pages) else None,
            "abp_prev_section": url_of(sec_first[sec_order[si - 1]]["src"]) if si > 0 else None,
            "abp_next_section": url_of(sec_first[sec_order[si + 1]]["src"]) if si + 1 < len(sec_order) else None,
        }
        if "cat" in p:
            meta["abp_color"] = p["cat"]["color"]
            meta["abp_color_ink"] = cat_ink(p["cat"]["color"])
            meta["abp_category"] = f'{p["cat"]["num"]}. {title_case(p["cat"]["title"])}'
            meta["abp_category_url"] = url_of(f'{p["cat"]["dir"]}/index.md')
        if "group" in p or src == "index.md":
            meta["hide"] = ["navigation", "toc"]
        elif src != "disclaimer.md":
            meta["hide"] = ["toc"]
        meta = {k: v for k, v in meta.items() if v is not None}
        files.append(File.generated(config, src, content=front_matter(**meta) + body))

    offline_meta = {"title": "Offline", "hide": ["navigation", "toc"], "search": {"exclude": True}}
    files.append(File.generated(config, "offline.md", content=front_matter(**offline_meta) + page_offline(d)))
    files.append(File.generated(config, "assets/works-index.json", content=works_index(d)))
    return files


# --------------------------------------------------------------------------- PWA: service worker + offline packs


def on_post_build(config, **kw):
    """Write sw.js (versioned app-shell precache) and assets/offline-packs.json (per-category page lists)."""
    import hashlib

    d = load()
    site = Path(config["site_dir"])

    # offline packs: every page of a category, with its size so the UI can show "≈ 12 MB"
    packs = {}
    for p in _pages:
        if "cat" not in p:
            continue
        c = p["cat"]
        pack = packs.setdefault(str(c["num"]), {"title": f'{c["num"]}. {title_case(c["title"])}', "pages": [], "bytes": 0})
        url = url_of(p["src"])
        f = site / url / "index.html"
        pack["pages"].append(url)
        pack["bytes"] += f.stat().st_size if f.exists() else 0
    (site / "assets" / "offline-packs.json").write_text(json.dumps(packs, ensure_ascii=False, separators=(",", ":")))

    # app shell: pages + assets needed to open the app and search offline
    shell = ["./", "master-index/", "find/", "library/", "foreword/", "legend/", "offline/", "manifest.webmanifest",
             "assets/works-index.json", "assets/offline-packs.json", "search/search_index.json", "sitemap.xml",
             "stylesheets/abp.css", "javascripts/abp.js", "javascripts/abp-pwa.js", "javascripts/abp-a11y.js",
             "assets/images/logo.svg", "assets/images/icon-192.png", "assets/images/apple-touch-icon.png",
             "assets/images/cover-640.webp", "assets/images/cover-1024.webp", "assets/images/signature.png"]
    for pattern in ("assets/stylesheets/*.css", "assets/javascripts/bundle.*.js", "assets/javascripts/workers/*.js"):
        shell += sorted(str(f.relative_to(site)) for f in site.glob(pattern))
    shell = [u for u in shell if (site / (u if not u.endswith("/") else u + "index.html")).exists() or u == "./"]

    h = hashlib.sha256()
    for u in shell:
        f = site / (u + "index.html" if u.endswith("/") else u)
        if u == "./":
            f = site / "index.html"
        h.update(u.encode())
        h.update(f.read_bytes())
    version = h.hexdigest()[:12]

    tpl = (ROOT / "hooks" / "sw.template.js").read_text(encoding="utf-8")
    sw = tpl.replace("__VERSION__", version).replace("__SHELL__", json.dumps(shell, indent=2))
    (site / "sw.js").write_text(sw, encoding="utf-8")
