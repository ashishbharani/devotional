"""Validate real generated social cards without changing canonical routes/data."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json


class Head(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.meta, self.canonical, self.structured = {}, [], []
        self.in_json = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            key = a.get('property', a.get('name'))
            if key:
                if key.startswith(('og:', 'twitter:')):
                    assert key not in self.meta, f'Duplicate social metadata: {key}'
                self.meta[key] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical.append(a.get('href'))
        if tag == 'script':
            self.in_json = a.get('type') == 'application/ld+json'

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_json = False

    def handle_data(self, text):
        if self.in_json and text.strip():
            self.structured.append(json.loads(text))


site = Path(__file__).resolve().parent.parent / 'site'
count = 0
for path in site.rglob('*.html'):
    head = Head(path.read_text(encoding='utf-8').split('</head>', 1)[0])
    m = head.meta
    assert m.get('og:title') and m.get('og:description'), path
    assert m['twitter:title'] == m['og:title'], path
    assert m['twitter:description'] == m['og:description'], path
    image = urlsplit(m['og:image'])
    assert image.scheme == 'https' and image.netloc, path
    assert image.path.endswith('/devotional/assets/images/hdc-brand/icon-512.png'), path
    assert m['twitter:image'] == m['og:image'], path
    assert m['og:image:alt'] == m['twitter:image:alt'], path
    assert m['og:image:width'] == m['og:image:height'] == '512', path
    assert (site / 'assets/images/hdc-brand/icon-512.png').is_file()
    assert len(head.canonical) <= 1, path
    if head.canonical:
        assert m['og:url'] == head.canonical[0], path
    assert any(item.get('@type') == 'WebPage' for item in head.structured), path
    count += 1
assert count > 2000, 'Build the full site first'
print(f'PASS social metadata: {count} pages; absolute approved image, canonical parity, valid JSON-LD')
