"""Check whole-book coverage, source boundaries and generated Reader routes."""
import hashlib
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from hooks.reader_books import DATA, generated_pages, load_books, pages
from scripts.audit_hosted_translations import Texts

books = load_books()
assert [b['id'] for b in books] == ['bhagavad-gita', 'ramcharitmanas','mahabharata','valmiki-ramayana']
gita, manas = books[:2]
expected = [47,72,43,42,29,47,30,28,34,42,55,20,35,27,20,24,28,78]
assert [len(c['passages']) for c in gita['chapters']] == expected
for c, count in zip(gita['chapters'], expected):
    assert [p['id'] for p in c['passages']] == [f'gita-{c["number"]}-{v}' for v in range(1,count+1)]
assert 'धर्मक्षेत्रे' in gita['chapters'][0]['passages'][0]['text']
assert 'कर्मण्येवाधिकारस्ते' in gita['chapters'][1]['passages'][46]['text']
assert 'प्रकृतिं पुरुषं' in gita['chapters'][12]['passages'][0]['text']
assert 'यत्र योगेश्वरः कृष्णो' in gita['chapters'][-1]['passages'][-1]['text']
assert len(manas['chapters']) == 7
for c, count in zip(manas['chapters'], [361,326,46,30,60,121,130]):
    primary = [p for p in c['passages'] if p['witness'] == 'primary']
    opening = [p for p in c['passages'] if p['witness'] == 'opening-supplement']
    assert len(primary) == count and len(opening) == (1 if c['number']==5 else 2)
    assert primary[0]['id'] == f'manas-{c["number"]}-1'
    assert primary[-1]['id'] == f'manas-{c["number"]}-{count}'
    assert opening[0]['language'] == 'sa'
    assert '\\r\\n' not in primary[0]['text']
assert 'वर्णानामर्थसंघानां' in manas['chapters'][0]['passages'][0]['text']
assert 'सकल सुमंगल दायक' in manas['chapters'][4]['passages'][-1]['text']
assert 'केकीकण्ठाभनीलं' in manas['chapters'][6]['passages'][0]['text']
assert 'श्रॆमद्रामचरितमानसमिदम' in manas['chapters'][6]['passages'][-1]['text']

all_ids = [p['id'] for b in books[:2] for c in b['chapters'] for p in c['passages']]
assert len(all_ids) == len(set(all_ids)) == 1788
assert all(re.fullmatch('[-a-z0-9]{1,80}', pid) for pid in all_ids)
for b in books:
    for c in b['chapters']:
        for p in c['passages']:
            assert p['text'].strip() and not any(k in p for k in ['translation','commentary','word_meanings','transliteration'])
generated = list(generated_pages())
assert len(generated) == 2709
assert sum(body.count('data-reader-passage') for _,_,body in generated) == 4428
assert all('translate="no"' in body and '<noscript>' in body for _,_,body in generated if 'data-reader-passage' in body)
assert 'Open Database License' in (DATA/'MANAS-ODBL.txt').read_text()
assert 'public domain' in (DATA/'GITA-UNLICENSE.txt').read_text()
manifest=json.loads((DATA/'manifest.json').read_text(encoding='utf-8'))
assert all(len(source['commit'])==40 for key,source in manifest['sources'].items() if key in {'gita','manas','openings'})
assert all(manifest['sources'][key]['url'].startswith('https://') and manifest['sources'][key]['licence'] for key in ['mahabharata','valmiki'])
assert '701' in manifest['editionNote'] and 'not a critical edition' in manifest['editionNote']
print('PASS four source witnesses: 701 Gita entries, 1087 Manas units, 1995 Mahabharata chapters, 645 Ramayana sargas; 2709 index/reading pages and source licences')

parser=Texts()
parser.feed('<h2>Reader controls</h2><p class="hdc-verse notranslate" lang="awa" translate="no">'+manas['chapters'][0]['passages'][2]['text']+'</p><p class="hdc-verse" lang="sa-Latn" translate="no">karmaṇy evādhikāras te</p><p lang="hi" translate="no">Public interface prose still needs review</p>')
assert parser.texts==['Reader controls','Public interface prose still needs review'], 'exclude sacred source, not ordinary prose, from interface backlog'
print('PASS sacred Awadhi/IAST source excluded from interface translation backlog; ordinary prose remains auditable')

if len(sys.argv)>1:
    assert sys.argv[1] in ['enabled','disabled']
    enabled=sys.argv[1]=='enabled'
    site=ROOT/'site'
    # Validate every destination against one file inventory instead of making
    # thousands of repeated filesystem calls for shared header/footer links.
    existing={Path(os.path.abspath(p)) for p in site.rglob('*') if p.is_file()}
    class Links(HTMLParser):
        def __init__(self): super().__init__();self.hrefs=[];self.ids=set()
        def handle_starttag(self,tag,attrs):
            a=dict(attrs)
            if 'id' in a:self.ids.add(a['id'])
            if tag=='a' and 'href' in a:self.hrefs.append(a['href'])
    parsed={}
    for path,_,_ in generated:
        target=site/path.replace('index.md','index.html')
        assert (Path(os.path.abspath(target)) in existing)==enabled,target
        if not enabled:continue
        parser=Links();parser.feed(target.read_text(encoding='utf-8'));parsed[Path(os.path.abspath(target))]=parser
    if enabled:
        native_index=json.loads((site/'search/search_index.json').read_text(encoding='utf-8'))
        assert not any(re.search(r'reader/(bhagavad-gita|ramcharitmanas|mahabharata|valmiki-ramayana)/chapter-', doc['location']) for doc in native_index['docs']), 'on-demand sacred books must not inflate the first-install search cache'
        assert any(doc['location'].split('#')[0]=='reader/' for doc in native_index['docs']), 'chapter discovery hub remains searchable'
        parser=Links();parser.feed((site/'reader/index.html').read_text(encoding='utf-8'));parsed[Path(os.path.abspath(site/'reader/index.html'))]=parser
        for source,parser in parsed.items():
            for href in parser.hrefs:
                u=urlsplit(href)
                if u.scheme or u.netloc or u.path.startswith('/'):continue
                target=Path(os.path.abspath(source.parent/unquote(u.path)))
                if not u.path:target=source
                elif target/'index.html' in existing:target=target/'index.html'
                assert target in existing,(source,href)
                if u.fragment and target in parsed:
                    assert unquote(u.fragment) in parsed[target].ids,(source,href)
        for filename in [*manifest['outputs'],'manifest.json',*(p.name for p in DATA.glob('*.txt'))]:
            assert (site/'assets/reader-books'/filename).read_bytes()==(DATA/filename).read_bytes(),filename
        assert 'Choose a book' in (site/'reader/index.html').read_text(encoding='utf-8')
    else:assert not (site/'assets/reader-books').exists()
    print(f'PASS Reader book routes, links, source downloads and release gate: {sys.argv[1]}')
