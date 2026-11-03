"""Validate generated discovery against actual canonical groups and work anchors."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hooks import generate


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links, self.images, self.ids, self.works, self.pathways = [], [], set(), {}, []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            assert a['id'] not in self.ids, ('duplicate ID', a['id'])
            self.ids.add(a['id'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
            if 'data-featured-work-id' in a:
                self.works[a['data-featured-work-id']] = a['href']
        if tag == 'img':
            self.images.append(a)
        if 'data-discovery-pathway' in a:
            self.pathways.append(int(a['data-discovery-pathway']))


site = ROOT / 'site'
html = (site / 'explore/index.html').read_text(encoding='utf-8')
page = Page(html)
data = generate.load()
assert page.pathways == [12, 3, 7, 5, 9]
for category in data['categories']:
    if category['num'] in page.pathways:
        for group in category['merged']:
            assert '../' + group['url'] in page.links, ('missing canonical group', group['name'])
assert set(page.works) == {'HDL2-CWID-25F980F2BD34A2107382', 'HDL2-CWID-E73C30069833764A47B2'}
parsed = {}
checked = 0
for href in page.links:
    url = urlsplit(urljoin('https://example.test/devotional/explore/', href))
    if url.hostname != 'example.test':
        continue
    assert url.path.startswith('/devotional/'), href
    path = site / unquote(url.path.removeprefix('/devotional/'))
    path = path / 'index.html' if path.is_dir() else path
    assert path.is_file(), ('broken path', href)
    if url.fragment:
        if path not in parsed:
            parsed[path] = Page(path.read_text(encoding='utf-8'))
        assert unquote(url.fragment) in parsed[path].ids, ('broken anchor', href)
    checked += 1
for cwid, href in page.works.items():
    url = urlsplit(href)
    assert url.fragment == 'work-' + cwid
    destination = site / url.path.removeprefix('../') / 'index.html'
    text = destination.read_text(encoding='utf-8')
    assert f'data-work-id="{cwid}" id="work-{cwid}"' in text
    assert text.count(f'id="work-{cwid}"') == 1
portraits = [i for i in page.images if 'abp-deity-portrait' in i.get('class', '')]
assert len(portraits) == 4
for image in portraits:
    assert image.get('loading') == 'lazy' and image.get('alt')
    assert (site / image['src'].removeprefix('../')).is_file()
assert '<!-- HDC_DISCOVERY_PATHS -->' not in html
print(f'PASS five complete canonical pathways, four approved portraits, two exact work landings and {checked} existing links')
