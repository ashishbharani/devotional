"""Preview-only static original-language book pages; reuse existing Reader state/UI."""
from __future__ import annotations

import hashlib
import html
import json
import posixpath
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "reader-books"


def load_books():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    books = []
    for filename, digest in manifest["outputs"].items():
        raw = (DATA / filename).read_bytes()
        if hashlib.sha256(raw).hexdigest() != digest:
            raise ValueError(f"Reader text hash changed: {filename}; inspect and reimport")
        book = json.loads(raw)
        ids = [p["id"] for c in book["chapters"] for p in c["passages"]]
        if not ids or len(ids) != len(set(ids)):
            raise ValueError("Missing or duplicate Reader passage IDs")
        books.append(book)
    return books


def pages(book):
    result = []
    for chapter in book["chapters"]:
        size = 80 if book["id"] == "bhagavad-gita" else 25
        for start in range(0, len(chapter["passages"]), size):
            part = start // size + 1
            base = f"reader/{book['id']}/chapter-{chapter['number']}/"
            path = base + (f"part-{part}/" if part > 1 else "")
            result.append({"path": path, "title": f"{book['title']} — {chapter['title']}" + (f" · Part {part}" if part > 1 else ""),
                           "chapter": chapter, "part": part, "passages": chapter["passages"][start:start + size]})
    return result


def hub():
    out = ['<section aria-label="Complete original-language books"><h2>Read complete books</h2>',
           '<p>Choose a chapter or kāṇḍa below. The Bhagavad Gita is in Sanskrit; Ramcharitmanas is in Awadhi with its Sanskrit invocations. These are original texts, not newly generated translations or commentary.</p>']
    for book in load_books():
        out.append(f'<h3>{html.escape(book["title"])}</h3><ul>')
        for chapter in book["chapters"]:
            legacy = ' id="gita-2-47"' if book['id'] == 'bhagavad-gita' and chapter['number'] == 2 else ''
            out.append(f'<li{legacy}><a href="{book["id"]}/chapter-{chapter["number"]}/">{html.escape(chapter["title"])}</a></li>')
        out.append('</ul>')
    out.append('<p>Books are split into manageable reading pages. Visited pages can be reused offline once cached by the installed app; this does not download every chapter on installation. Open the chapters you need while online.</p></section>')
    return "\n".join(out)


def controls():
    return '''<div class="hdc-practice-controls">
<label hidden>Reading passage <select data-reader-select></select></label>
<label>Text size <select data-reader-size><option value="1">Comfortable</option><option value="1.25">Large</option><option value="1.5">Extra large</option></select></label>
<label>Line spacing <select data-reader-spacing><option value="1.8">Comfortable</option><option value="2.2">Spacious</option></select></label>
<label>Find on this reading page <input type="search" data-reader-query placeholder="Original text or passage number"></label>
<button type="button" data-bookmark aria-pressed="false">Bookmark passage</button>
<button type="button" data-read aria-pressed="false">Mark passage read</button>
<button type="button" data-reader-share>Share passage link</button>
<button type="button" data-reader-print>Print passage</button>
<button type="button" data-reader-clear>Clear this page's progress and reader history</button>
</div>
<p data-reader-progress role="status"></p>
<p><a href="#" data-reader-global-continue hidden>Continue last saved reading page</a></p>
<p><a href="#" data-reader-continue hidden>Continue saved passage on this page</a></p>
<p data-reader-empty hidden>No matching passage on this reading page.</p>'''


def render(book, page, all_pages):
    esc = html.escape
    relative = lambda path: posixpath.relpath(path, page["path"]) + "/"
    out = [f'# {page["title"]}\n', '<p><a href="' + relative("reader") + '">Sacred Reader — all chapters and kāṇḍas</a></p>',
           '<p>Original text. No automatic sacred-text translation is applied. Select or focus a passage before bookmarking or marking it read. Progress is local to this browser; the count below is for this reading page.</p>',
           '<section class="hdc-practice hdc-reader" data-reader aria-label="Original-language book reader">', controls()]
    for passage in page["passages"]:
        lines = '<br>'.join(esc(line) for line in passage["text"].split('\n'))
        out.append(f'<article id="{passage["id"]}" tabindex="-1" data-reader-passage><h2>{esc(passage["label"])}</h2><p class="hdc-verse notranslate" lang="{passage.get("language", book["language"])}" translate="no">{lines}</p><p><a href="#{passage["id"]}">Permanent passage link</a></p></article>')
    out.extend(['<details class="hdc-practice-details"><summary>My local reading history</summary><p>Only explicit read marking adds an entry. Up to 50 entries stay in this browser. Clearing this page’s progress also clears that history; other pages’ flags remain.</p><ol data-reader-history-items class="notranslate" translate="no"></ol></details>',
                '<p data-reader-status role="status" aria-live="polite"></p>',
                '<label data-reader-link hidden>Passage link (copy manually if needed)<input type="text" readonly></label></section>'])
    index = all_pages.index(page)
    out.append('<nav aria-label="Book reading order"><ul>')
    for label, neighbour in [('Previous reading page', index - 1), ('Next reading page', index + 1)]:
        if 0 <= neighbour < len(all_pages):
            target = all_pages[neighbour]
            out.append(f'<li><a href="{relative(target["path"].rstrip("/"))}">{label}: {esc(target["title"])}</a></li>')
    out.append('</ul></nav>')
    if book['id'] == 'ramcharitmanas':
        # Retain the database's required attribution without the removed panel.
        asset = relative('assets/reader-books').rstrip('/') + '/'
        out.append(f'<p class="hdc-reader-credit">Database credit: <a href="https://github.com/bhavykhatri/DharmicData">DharmicData contributors</a> · <a href="{asset}MANAS-ODBL.txt">ODbL 1.0</a> · <a href="{asset}ramcharitmanas.json">Database copy</a></p>')
    out.append('<noscript>The complete original text and reading-order links on this page work without JavaScript. Private progress controls require JavaScript.</noscript>')
    return '\n'.join(out)


def generated_pages():
    for book in load_books():
        book_pages = pages(book)
        for page in book_pages:
            yield page['path'] + 'index.md', page['title'], render(book, page, book_pages)
