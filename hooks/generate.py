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
import json
import re
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote_plus

from mkdocs.structure.files import File

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "collection.json"
YT = "https://www.youtube.com/results?search_query="
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
                groups.append(
                    {
                        "name": g["name"],
                        "slug": slug,
                        "page": g["page"],
                        "forms": forms,
                        "count": sum(len(f["works"]) for f in forms),
                    }
                )
            cat["merged"] = groups
            cat["slug"] = f"{cat['num']:02d}-{slugify(cat['title'])}"
            cat["dir"] = f"categories/{cat['slug']}"
    return _data


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
    out.append('<img class="abp-foreword__sign" src="../assets/images/signature.png" alt="Signature — Advocate Ashish Bharani">')
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
    return titlebar("Integrated Master Index", f"42 categories · {fmt(total)} works", "abp-titlebar--plum") + category_bars(d, "../")


def page_home(d):
    total = sum(c["works_stated"] for c in d["categories"])
    groups = sum(len(c["merged"]) for c in d["categories"])
    return (
        '<section class="abp-cover" markdown="0">\n'
        '<img src="assets/images/cover.jpg" alt="Ultimate Hindu Devotional Collection — a pan-India multilingual devotional reference, collected and compiled by Advocate Ashish Bharani">\n'
        '<a class="abp-cover__hot abp-cover__hot--left" href="library/" title="Scriptures &amp; Books Library"><span>Scriptures &amp; Books Library</span></a>\n'
        '<a class="abp-cover__hot abp-cover__hot--right" href="master-index/" title="Integrated Master Index"><span>Integrated Master Index</span></a>\n'
        "</section>\n\n"
        '<div class="abp-stats" markdown="0">'
        f"<div><b>{fmt(total)}</b><span>works</span></div>"
        f"<div><b>42</b><span>categories</span></div>"
        f"<div><b>{fmt(groups)}</b><span>deities, traditions &amp; groups</span></div>"
        f'<div><b>{fmt(d["pages"])}</b><span>pages in the PDF edition</span></div>'
        "</div>\n\n"
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
    out.append('<div class="abp-subindex" markdown="0">')
    for g in c["merged"]:
        chips = "".join(
            f'<a href="{g["slug"]}/#{f["anchor"]}">{esc(f["name"])}<small>{len(f["works"])}</small></a>' for f in g["forms"]
        )
        out.append(
            f'<section class="abp-group"><a class="abp-group__bar" href="{g["slug"]}/">'
            f'<span>{esc(g["name"])}</span><small>{fmt(g["count"])} works</small></a>'
            f'<div class="abp-group__forms">{chips}</div></section>'
        )
    out.append("</div>\n")
    return "\n".join(out)


COLGROUP = (
    '<colgroup><col class="c-n"><col class="c-w"><col class="c-lang"><col class="c-form"><col class="c-tier">'
    '<col class="c-singer"><col class="c-purp"><col class="c-time"><col class="c-jyo"><col class="c-aff"></colgroup>'
)


def cell(v: str, cls: str, label: str) -> str:
    v = v or "—"
    return f'<td class="{cls}" data-label="{label}">{esc(v)}</td>'


def page_group(c, g):
    out = [titlebar(f"{c['num']}. {c['title']}", "", "abp-titlebar--cat")]
    head = "".join(f'<th class="{k}">{esc(h)}</th>' for h, k in COLUMNS)
    out.append(
        f'<div class="abp-sheet abp-sheet--head" markdown="0" data-search-exclude><table class="abp-table abp-table--head">{COLGROUP}'
        f"<thead><tr>{head}</tr></thead></table></div>\n"
        f'<div class="abp-groupbar" markdown="0"><h2>{esc(g["name"])}</h2>'
        f'<p>{fmt(g["count"])} works · {len(g["forms"])} forms</p></div>\n'
    )
    if len(g["forms"]) > 1:
        chips = "".join(f'<a href="#{f["anchor"]}">{esc(f["name"])}<small>{len(f["works"])}</small></a>' for f in g["forms"])
        out.append(f'<nav class="abp-jump" markdown="0" aria-label="Forms in this section">{chips}</nav>\n')
    n = 0
    for f in g["forms"]:
        out.append(f'\n## {f["name"]} {{ #{f["anchor"]} .abp-formbar }}\n')
        rows = []
        for w in f["works"]:
            n += 1
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
            f'<div class="abp-sheet" markdown="0"><table class="abp-table" data-search-exclude>{COLGROUP}<tbody>\n'
            + "\n".join(rows)
            + "\n</tbody></table></div>\n"
        )
    return "\n".join(out)


def page_find(d):
    opts = "".join(f'<option value="{c["num"]}">{c["num"]}. {esc(title_case(c["title"]))}</option>' for c in d["categories"])
    return titlebar("Find a Work", "Search all works by title, language, form or tier", "abp-titlebar--slate") + (
        '<div class="abp-finder" markdown="0" data-index="../assets/works-index.json">\n'
        '<div class="abp-finder__controls">'
        '<input type="search" id="abp-q" placeholder="Type a title, e.g. Hanuman Chalisa, Ganesha Ashtakam…" autocomplete="off">'
        f'<select id="abp-cat"><option value="">All categories</option>{opts}</select>'
        '<select id="abp-lang"><option value="">All languages</option></select>'
        '<select id="abp-tier"><option value="">All tiers</option><option>T1</option><option>T2</option><option>T3</option><option>T4</option></select>'
        "</div>\n"
        '<p class="abp-finder__status" id="abp-status">Loading index…</p>\n'
        '<div class="abp-sheet"><table class="abp-table abp-table--finder"><thead><tr><th class="n">#</th><th class="w">Works</th>'
        '<th class="lang">Language</th><th class="form">Form</th><th class="tier">Tier</th><th class="where">Found in</th></tr></thead>'
        '<tbody id="abp-results"></tbody></table></div>\n'
        "</div>\n"
    )


def works_index(d) -> str:
    """Compact finder index: shared lookup tables + one short array per work."""
    langs, forms, places = [], [], []
    li, fi, pi = {}, {}, {}
    rows = []
    for c in d["categories"]:
        for g in c["merged"]:
            for f in g["forms"]:
                key = f'{c["dir"]}/{g["slug"]}/#{f["anchor"]}'
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
            add(f'{c["dir"]}/{g["slug"]}.md', g["name"], c["num"], cat=c, group=g)
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
            body = page_group(p["cat"], p["group"])
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

    files.append(File.generated(config, "assets/works-index.json", content=works_index(d)))
    return files
