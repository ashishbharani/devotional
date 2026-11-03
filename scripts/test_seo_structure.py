"""Check actual generated breadcrumb URLs and preview-only private-page metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys

assert sys.argv[1:] in [['enabled'], ['disabled']]
enabled = sys.argv[1] == 'enabled'
site = Path(__file__).resolve().parent.parent / 'site'


class Head(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.data, self.meta, self.canonical = [], {}, None
        self.in_json = False
        self.feed(text.split('</head>', 1)[0])

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'script':
            self.in_json = a.get('type') == 'application/ld+json'
        if tag == 'meta':
            self.meta[a.get('name', a.get('property'))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_json = False

    def handle_data(self, text):
        if self.in_json and text.strip():
            self.data.append(json.loads(text))


count = 0
for file in site.rglob('*.html'):
    text = file.read_text(encoding='utf-8')
    head = Head(text)
    breadcrumbs = [o for o in head.data if o.get('@type') == 'BreadcrumbList']
    assert len(breadcrumbs) <= 1, file
    if not enabled:
        assert not breadcrumbs, file
    if breadcrumbs:
        items = breadcrumbs[0]['itemListElement']
        assert [i['position'] for i in items] == list(range(1, len(items) + 1)), file
        assert [i['name'] for i in items[:2]] == ['Home', 'Devotional Works'], file
        assert len(items) in (3, 4) and items[-1]['item'] == head.canonical, file
        for item in items:
            url = urlsplit(item['item'])
            assert url.scheme == 'https' and url.netloc == 'ashishbharani.github.io', file
            assert url.path.startswith('/devotional/'), file
            target = site / unquote(url.path[len('/devotional/'):])
            if target.is_dir():
                target = target / 'index.html'
            assert target.is_file(), (file, item)
        count += 1
if enabled:
    assert count > 2000, count
    private = (site / 'journeys/index.html').read_text(encoding='utf-8')
    assert Head(private).meta['robots'] == 'noindex,nofollow'
    assert 'data-share-page' not in private
    assert 'Synthetic private note' not in private
    assert not (site / 'templates/editorial-article.html').exists()
print(f'PASS SEO structure ({sys.argv[1]}): {count} canonical breadcrumb hierarchies; no fabricated URLs or journal metadata')
