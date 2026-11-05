"""Coverage, transcription and attribution checks for new epic witnesses."""
import collections,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from scripts.import_reader_epics import slp1,wiki_text
from hooks.reader_books import load_books

for original,expected in [('rAmaH','रामः'),('kfzRa','कृष्ण'),('nArAyaRaM','नारायणं'),('devIM sarasvatIM','देवीं सरस्वतीं'),('jYAnam','ज्ञानम्'),('fFxX','ऋॠऌॡ')]:
    assert slp1(original)==expected,(original,slp1(original))
assert wiki_text('<pre>रामः<BR>सीता</poem>{{navigation}}==स्रोतः==audio')=='रामः\nसीता'
assert wiki_text('<poem>रामः\nसीता</poem>[[वर्गः:x]]')=='रामः\nसीता'
try:wiki_text('<poem>{{unresolved}}</poem>')
except ValueError:pass
else:raise AssertionError('Unresolved template must not be silently dropped')

books={b['id']:b for b in load_books()}
mbh=books['mahabharata'];valmiki=books['valmiki-ramayana']
counts=[225,72,299,67,197,117,173,69,64,18,27,353,154,96,47,9,3,5]
groups=list(dict.fromkeys(c['group'] for c in mbh['chapters']))
assert len(groups)==18
assert [sum(c['group']==group for c in mbh['chapters']) for group in groups]==counts
for group,count in zip(groups,counts):assert [c['sourceChapter'] for c in mbh['chapters'] if c['group']==group]==list(range(1,count+1))
assert len(mbh['chapters'])==1995
assert mbh['chapters'][0]['passages'][0]['text'].startswith('नारायणं नमस्कृत्य')
assert 'पुष्करजलैर् अभिषेचनेन' in mbh['chapters'][-1]['passages'][0]['text']
for c in mbh['chapters']:
    p=c['passages'][0];assert p['text']==slp1(p['sourceText']) and c['sourceUrl'].startswith('https://sanskritlibrary.org/')
groups=list(dict.fromkeys(c['group'] for c in valmiki['chapters']))
assert [sum(c['group']==g for c in valmiki['chapters']) for g in groups]==[77,119,75,67,68,128,111]
assert 'तपः स्वाध्यायनिरतं' in valmiki['chapters'][0]['passages'][0]['text']
assert len(valmiki['chapters'])==645
for c in valmiki['chapters']:
    assert isinstance(c['sourceRevision'],int) and c['sourceRevision']>0
    assert c['sourceTitle'].startswith('रामायणम्/')
    assert len(c['passages'][0]['text'])>80
assert 'NonCommercial' in (ROOT/'data/reader-books/MAHABHARATA-LICENCE.txt').read_text()
assert 'ShareAlike' in (ROOT/'data/reader-books/VALMIKI-LICENCE.txt').read_text()
ids=[p['id'] for b in books.values() for c in b['chapters'] for p in c['passages']]
assert len(ids)==len(set(ids))==4428
assert all('translation' not in p for b in books.values() for c in b['chapters'] for p in c['passages'])
print('PASS 18 critical-edition parvas / 1995 chapters, seven kandas / 645 sargas, exact transcription, licence attribution and stable unique IDs')
