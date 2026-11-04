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
    out = ['<section aria-label="Complete original-language books"><h2>Choose a book</h2>',
           '<p>Open a book, choose a chapter, then read. Your bookmarks and reading progress stay in this browser.</p><div class="hdc-reader-books">']
    for book in load_books():
        out.append(f'<article><h3><a href="{book["id"]}/">{html.escape(book["title"])}</a></h3><p>{len(book["chapters"])} reading chapters · Original {"Awadhi and Sanskrit" if book["language"]=="awa" else "Sanskrit"}</p><a href="{book["id"]}/">Choose a chapter →</a></article>')
    out.append('</div><details class="hdc-practice-details"><summary>Languages, editions and offline reading</summary><p>These are original-language electronic texts. Hindi translations are not bundled. The Gita witness includes Arjuna’s opening chapter-13 question and has 701 numbered entries. Source details identify edition differences; these are not critical editions. Open chapters online before using them offline; installation does not download all books.</p></details></section>')
    return "\n".join(out)


def contents(book):
    out=[f'# {book["title"]}\n','<p><a href="../">All books</a></p>', '<h2>Choose a chapter</h2><div data-book-contents>']
    groups={}
    for chapter in book['chapters']:
        groups.setdefault(chapter.get('group','Chapters'),[]).append(chapter)
    for name,chapters in groups.items():
        if len(groups)>1:out.append(f'<details class="hdc-practice-details"><summary>{html.escape(name)} · {len(chapters)} chapters</summary>')
        out.append('<ol>')
        for chapter in chapters:out.append(f'<li><a href="chapter-{chapter["number"]}/">{html.escape(chapter["title"])}</a></li>')
        out.append('</ol>')
        if len(groups)>1:out.append('</details>')
    out.append('</div>')
    return '\n'.join(out)


def controls():
    return '''<div class="hdc-practice-controls">
<label hidden>Reading passage <select data-reader-select></select></label>
<button type="button" data-bookmark aria-pressed="false">Bookmark passage</button>
<button type="button" data-read aria-pressed="false">Mark passage read</button>
</div>
<details class="hdc-practice-details" data-reader-options><summary>Search, text size and more options</summary><div class="hdc-practice-controls">
<label>Find on this reading page <input type="search" data-reader-query placeholder="Original text or passage number"></label>
<label>Text size <select data-reader-size><option value="1">Comfortable</option><option value="1.25">Large</option><option value="1.5">Extra large</option></select></label>
<label>Line spacing <select data-reader-spacing><option value="1.8">Comfortable</option><option value="2.2">Spacious</option></select></label>
<button type="button" data-reader-share>Share passage link</button>
<button type="button" data-reader-print>Print passage</button>
<button type="button" data-reader-clear>Clear this page's progress and reader history</button>
</div></details>
<p data-reader-progress role="status"></p>
<p><a href="#" data-reader-global-continue hidden>Continue last saved reading page</a></p>
<p><a href="#" data-reader-continue hidden>Continue saved passage on this page</a></p>
<p data-reader-empty hidden>No matching passage on this reading page.</p>'''


def render(book, page, all_pages):
    esc = html.escape
    relative = lambda path: posixpath.relpath(path, page["path"]) + "/"
    out = [f'# {page["title"]}\n', '<p><a href="' + relative("reader") + '">All books</a> · <a href="'+relative('reader/'+book['id'])+'">Choose another chapter</a></p>',
           '<p>Original text · Select a passage to bookmark or mark read.</p>',
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
    out.append('</ul></nav><details class="hdc-practice-details"><summary>Text source, edition and reuse</summary>')
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    names = book.get('sourceKeys') or (['gita'] if book['id'] == 'bhagavad-gita' else ['manas', 'openings'])
    for name in names:
        source = manifest['sources'][name]
        url=source.get('url') or f'{source["repository"]}/tree/{source["commit"]}/{source["path"]}'
        out.append(f'<p><a href="{esc(url,quote=True)}">{esc(source.get("label",name))} — source and contributors</a></p>')
    chapter=page['chapter']
    if chapter.get('sourceRevision'):
        out.append(f'<p><a href="https://sa.wikisource.org/w/index.php?oldid={chapter["sourceRevision"]}">Exact source revision {chapter["sourceRevision"]}: {esc(chapter["sourceTitle"])}</a> — Sanskrit Wikisource contributors. Formatting adapted to this Reader.</p>')
    if chapter.get('sourceUrl'):out.append(f'<p><a href="{chapter["sourceUrl"]}">This parva’s source and licence</a>. SLP1 transcribed into Devanagari; source encoding retained in the download.</p>')
    out.append(f'<p>{esc(book.get("editionNote",manifest["editionNote"]))}</p>')
    out.append('<p>Underlying ancient text is public domain. Electronic source and assembled database terms are retained with the download. Only original-language text is included; no modern translation or commentary is copied.</p>')
    asset = relative('assets/reader-books').rstrip('/') + '/'
    out.append(f'<p><a href="{asset}{book["id"]}.json">Download this original-text database (JSON)</a> · <a href="{asset}manifest.json">Provenance, input/output hashes and transformations</a></p>')
    licences = book.get('licences') or (['GITA-UNLICENSE.txt'] if book['id'] == 'bhagavad-gita' else ['MANAS-UNLICENSE.txt', 'MANAS-ODBL.txt'])
    out.append('<ul>' + ''.join(f'<li><a href="{asset}{name}">{name}</a></li>' for name in licences) + '</ul>')
    out.append('<p>Visited reading pages can be reopened offline after successful caching. Unvisited pages require a connection. Existing theme, text size, bookmarks and read flags are retained; no account synchronization is claimed.</p>')
    out.append('<noscript>The complete original text and reading-order links on this page work without JavaScript. Private progress controls require JavaScript.</noscript>')
    out.append('</details>')
    return '\n'.join(out)


def generated_pages():
    for book in load_books():
        yield 'reader/'+book['id']+'/index.md',book['title'],contents(book)
        book_pages = pages(book)
        for page in book_pages:
            yield page['path'] + 'index.md', page['title'], render(book, page, book_pages)
