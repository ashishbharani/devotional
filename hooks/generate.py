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

from mkdocs.structure.files import File

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "collection.json"
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

_data: dict | None = None
_pages: list[dict] = []  # linear reading order


# --------------------------------------------------------------------------- helpers


def esc(s: str) -> str:
    return html.escape(s or "", quote=True)


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


def load():
    global _data
    if _data is None:
        _data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        for cat in _data["categories"]:
            merged: OrderedDict[str, dict] = OrderedDict()
            for g in cat["groups"]:
                tgt = merged.setdefault(g["name"], {"name": g["name"], "page": g["page"], "forms": OrderedDict()})
                for f in g["forms"]:
                    base = CONTINUED.sub("", f["name"]).strip()
                    tgt["forms"].setdefault(base, []).extend(f["works"])
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
            cat["slug"] = f"{cat['num']:02d}-{slugify(cat['title'])}"
            cat["dir"] = f"categories/{cat['slug']}"
            cat["url"] = cat["dir"] + "/"
            for group in groups:
                split_parts(cat, group)
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


def titlebar(title: str, subtitle: str = "", kind: str = "") -> str:
    sub = f'<p class="abp-titlebar__sub">{esc(subtitle)}</p>' if subtitle else ""
    return f'<header class="abp-titlebar {kind}" markdown="0"><h1>{esc(title)}</h1>{sub}</header>\n\n'


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
    out.append('<header class="abp-foreword__band"><h1>FOREWORD</h1><p>HINDU DEVOTIONAL LIBRARY</p></header>')
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
        f'<div class="abp-card"><span class="abp-card__num">{n}</span><div><h3>{esc(h)}</h3><p>{esc(t)}</p></div></div>'
        for n, h, t in items
    )
    return titlebar("Legend — Publication Method", f"Guide · {len(items)} notes", "abp-titlebar--sand") + (
        f'<div class="abp-cards" markdown="0">\n{cards}\n</div>\n'
    )


def page_rules(d):
    items = [it for pg in d["front"]["rules"] for it in numbered_items(pg)]
    cards = "\n".join(
        f'<div class="abp-card abp-card--rule"><span class="abp-card__num">{n}</span><div><p>{esc(t)}</p></div></div>'
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
            btns = "".join(
                f'<a class="abp-btn" href="{esc(b["links"][k])}" target="_blank" rel="noopener">{k.upper()}</a>'
                for k in ("open", "english", "hindi", "listen")
                if k in b["links"]
            )
            cards.append(
                f'<div class="abp-book"><div class="abp-book__cover" style="--cover:{b["cover"]}">'
                f'<span>SACRED TEXT</span><i></i></div><h3>{esc(b["title"])}</h3>'
                f'<div class="abp-book__btns">{btns}</div></div>'
            )
        out.append('<div class="abp-books" markdown="0">\n' + "\n".join(cards) + "\n</div>\n")
    return "\n".join(out)


def category_bars(d, prefix=""):
    rows = []
    for c in d["categories"]:
        rows.append(
            f'<a class="abp-catbar" style="--abp-cat:{c["color"]}" href="{prefix}{c["dir"]}/">'
            f'<span class="abp-catbar__num">{c["num"]}</span>'
            f'<span class="abp-catbar__title">{esc(c["title"])}</span>'
            f'<span class="abp-catbar__stats">{fmt(c["works_stated"])} works | {fmt(c["sections_stated"])} sections</span></a>'
        )
    return '<nav class="abp-catbars" markdown="0">\n' + "\n".join(rows) + "\n</nav>\n"


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
        '<section class="abp-cover" markdown="0">\n'
        "<picture>"
        '<source type="image/webp" sizes="(min-width: 90rem) 1400px, 100vw" '
        'srcset="assets/images/cover-640.webp 640w, assets/images/cover-1024.webp 1024w, assets/images/cover-1491.webp 1491w">'
        '<img src="assets/images/cover-1024.jpg" sizes="(min-width: 90rem) 1400px, 100vw" '
        'srcset="assets/images/cover-640.jpg 640w, assets/images/cover-1024.jpg 1024w, assets/images/cover-1491.jpg 1491w" '
        'width="1491" height="1055" fetchpriority="high" decoding="async" '
        'alt="Ultimate Hindu Devotional Collection — a pan-India multilingual devotional reference, collected and compiled by Advocate Ashish Bharani">'
        "</picture>\n"
        '<a class="abp-cover__hot abp-cover__hot--left" href="library/" title="Scriptures &amp; Books Library"><span>Scriptures &amp; Books Library</span></a>\n'
        '<a class="abp-cover__hot abp-cover__hot--right" href="master-index/" title="Integrated Master Index"><span>Integrated Master Index</span></a>\n'
        "</section>\n\n"
        '<div class="abp-stats" markdown="0">'
        f"<div><b>{fmt(total)}</b><span>works</span></div>"
        f"<div><b>42</b><span>categories</span></div>"
        f"<div><b>{fmt(groups)}</b><span>deities, traditions &amp; groups</span></div>"
        f'<div><b>{fmt(d["pages"])}</b><span>pages in the PDF edition</span></div>'
        "</div>\n\n"
        '<div id="abp-install" class="abp-install" markdown="0" hidden></div>\n\n'
        '<div class="abp-home-links" markdown="0">'
        '<a class="abp-btn abp-btn--big" href="foreword/">Foreword</a>'
        '<a class="abp-btn abp-btn--big" href="library/">Scriptures &amp; Books Library</a>'
        '<a class="abp-btn abp-btn--big" href="master-index/">Integrated Master Index</a>'
        '<a class="abp-btn abp-btn--big" href="find/">Find a Work</a>'
        "</div>\n\n"
        + titlebar("Integrated Master Index", "Choose a category", "abp-titlebar--plum")
        + category_bars(d)
    )


def page_category(c):
    out = [titlebar(f"{c['num']}. {c['title']}", "Sections and deity subsections", "abp-titlebar--cat")]
    out.append(
        f'<p class="abp-lede" markdown="0">{fmt(c["works_stated"])} works · {fmt(len(c["merged"]))} groups · '
        f'{fmt(c["sections_stated"])} sections</p>\n'
    )
    out.append(f'<div class="abp-offline" data-pack="{c["num"]}" markdown="0" hidden></div>\n')
    out.append('<div class="abp-subindex" markdown="0">')
    for g in c["merged"]:
        chips = "".join(
            f'<a href="{rel(c["url"], f["url"])}#{f["anchor"]}">{esc(f["name"])}<small>{len(f["works"])}</small></a>'
            for f in g["forms"]
        )
        parts = f' · {len(g["parts"])} pages' if len(g["parts"]) > 1 else ""
        out.append(
            f'<section class="abp-group"><a class="abp-group__bar" href="{rel(c["url"], g["url"])}">'
            f'<span>{esc(g["name"])}</span><small>{fmt(g["count"])} works{parts}</small></a>'
            f'<div class="abp-group__forms">{chips}</div></section>'
        )
    out.append("</div>\n")
    return "\n".join(out)


COLGROUP = (
    '<colgroup><col class="c-n"><col class="c-w"><col class="c-lang"><col class="c-form"><col class="c-tier">'
    '<col class="c-singer"><col class="c-purp"><col class="c-time"><col class="c-jyo"><col class="c-aff"></colgroup>'
)


def cell(v: str, cls: str, label: str) -> str:
    if not v:
        return f'<td class="{cls} is-empty" data-label="{label}">—</td>'
    return f'<td class="{cls}" data-label="{label}">{esc(v)}</td>'


def part_nav(g, part) -> str:
    if len(g["parts"]) == 1:
        return ""
    links = []
    for p in g["parts"]:
        label = f'{p["num"]}'
        if p is part:
            links.append(f'<span class="abp-parts__cur" aria-current="page">{label}</span>')
        else:
            links.append(f'<a href="{rel(part["url"], p["url"])}">{label}</a>')
    return f'<nav class="abp-parts" markdown="0" aria-label="Pages of this section"><span>Page</span>{"".join(links)}</nav>\n'


def page_group(c, g, part):
    out = [titlebar(f"{c['num']}. {c['title']}", "", "abp-titlebar--cat")]
    head = "".join(f'<th class="{k}">{esc(h)}</th>' for h, k in COLUMNS)
    first, last = part["start"] + 1, part["start"] + part["count"]
    info = f'{fmt(g["count"])} works · {len(g["forms"])} forms'
    if len(g["parts"]) > 1:
        info = f'Page {part["num"]} of {len(g["parts"])} · works {fmt(first)}–{fmt(last)} of {fmt(g["count"])} · {len(g["forms"])} forms'
    out.append(
        f'<div class="abp-sheet abp-sheet--head" markdown="0" data-search-exclude><table class="abp-table abp-table--head">{COLGROUP}'
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
            chips.append(f'<a href="{href}"{cls}>{esc(f["name"])}<small>{len(f["works"])}</small></a>')
        chips = "".join(chips)
        out.append(
            f'<details class="abp-jumpbox" open markdown="0"><summary>Jump to a form ({len(g["forms"])})</summary>'
            f'<nav class="abp-jump" aria-label="Forms in this section">{chips}</nav></details>\n'
        )
    for f in part["forms"]:
        name = f["name"] + (" — CONTINUED" if f["continued"] else "")
        out.append(f'\n## {name} {{ #{f["anchor"]} .abp-formbar }}\n')
        rows = []
        for n, w in enumerate(f["works"], f["start"] + 1):
            rows.append(
                "<tr>"
                f'<td class="n">{n}</td>'
                f'<td class="w"><a href="{esc(w["url"])}" target="_blank" rel="noopener" title="Search YouTube for this work">'
                f'<span class="abp-play" aria-hidden="true"></span>{esc(w["title"])}</a></td>'
                + cell(w["language"], "lang", "Language")
                + cell(w["form"], "form", "Form")
                + f'<td class="tier" data-label="Tier"><span class="abp-tier abp-tier--{esc(w["tier"].lower())}">{esc(w["tier"] or "—")}</span></td>'
                + cell(w["singer"], "singer", "Preferred Singer / Recitation")
                + cell(w["purposes"], "purp", "Traditional Purposes")
                + cell(w["best_time"], "time", "Best Time")
                + cell(w["jyotisha"], "jyo", "Jyotisha")
                + cell(w["affliction"], "aff", "Horoscope Affliction")
                + "</tr>"
            )
        out.append(
            f'<div class="abp-sheet abp-sheet--body" style="--rows:{len(f["works"])}" markdown="0">'
            f'<table class="abp-table" data-search-exclude>{COLGROUP}<tbody>\n'
            + "\n".join(rows)
            + "\n</tbody></table></div>\n"
        )
    out.append(part_nav(g, part))
    return "\n".join(out)


def page_offline(d):
    cats = {c["dir"] + "/": f'{c["num"]}. {title_case(c["title"])}' for c in d["categories"]}
    return titlebar("You're offline", "Saved pages are still available", "abp-titlebar--sand") + (
        '<div class="abp-offline-page" markdown="0">\n'
        "<p>This page isn't saved on this device yet, so it can't be shown without an internet connection.</p>\n"
        "<p>Everything you have opened before, and every category you saved with <b>Save for offline</b>, "
        "still works. Pick one below, or try again when you're back online.</p>\n"
        '<p class="abp-home-links"><a class="abp-btn abp-btn--big" href="../">Home</a>'
        '<a class="abp-btn abp-btn--big" href="../master-index/">Integrated Master Index</a>'
        '<a class="abp-btn abp-btn--big" href="../find/">Find a Work</a>'
        '<button type="button" class="abp-btn abp-btn--big" onclick="location.reload()">Try again</button></p>\n'
        f"<div id=\"abp-saved\" data-cats='{esc(json.dumps(cats, ensure_ascii=False))}'></div>\n"
        "</div>\n"
    )


def page_find(d):
    opts = "".join(f'<option value="{c["num"]}">{c["num"]}. {esc(title_case(c["title"]))}</option>' for c in d["categories"])
    return titlebar("Find a Work", "Search all works by title, language, form or tier", "abp-titlebar--slate") + (
        '<div class="abp-finder" markdown="0" data-index="../assets/works-index.json">\n'
        '<div class="abp-finder__controls">'
        '<input type="search" id="abp-q" inputmode="search" enterkeyhint="search" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Search works" placeholder="Type a title, e.g. Hanuman Chalisa, Ganesha Ashtakam…" autocomplete="off">'
        f'<select id="abp-cat" aria-label="Category"><option value="">All categories</option>{opts}</select>'
        '<select id="abp-lang" aria-label="Language"><option value="">All languages</option></select>'
        '<select id="abp-tier" aria-label="Tier"><option value="">All tiers</option><option>T1</option><option>T2</option><option>T3</option><option>T4</option></select>'
        "</div>\n"
        '<p class="abp-finder__status" id="abp-status">Loading index…</p>\n'
        '<div class="abp-sheet"><table class="abp-table abp-table--finder"><thead><tr><th class="n">#</th><th class="w">Works</th>'
        '<th class="lang">Language</th><th class="form">Form</th><th class="tier">Tier</th><th class="where">Found in</th></tr></thead>'
        '<tbody id="abp-results"></tbody></table></div>\n'
        '<p class="abp-finder__more"><button type="button" class="abp-btn abp-btn--big" id="abp-more" hidden>Show more results</button></p>\n'
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
             "assets/works-index.json", "assets/offline-packs.json", "search/search_index.json",
             "stylesheets/abp.css", "javascripts/abp.js", "javascripts/abp-pwa.js",
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
