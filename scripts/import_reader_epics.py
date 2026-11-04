"""Offline, reproducible import of attributed Sanskrit epic witnesses.

Input downloads are explicit maintenance work, never part of a site build.
The Sanskrit Library continuous-text rows are retained alongside deterministic
SLP1-to-Devanagari transcription; Wikisource revisions are pinned per sarga.
"""
import hashlib
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'work/wiki-epics'
DEST=ROOT/'data/reader-books'
PARVAS=['Adi','Sabha','Vana','Virata','Udyoga','Bhishma','Drona','Karna','Shalya','Sauptika','Stri','Shanti','Anushasana','Ashvamedhika','Ashramavasika','Mausala','Mahaprasthanika','Svargarohana']
KANDAS=['बालकाण्डम्','अयोध्याकाण्डम्','अरण्यकाण्डम्','किष्किन्धाकाण्डम्','सुन्दरकाण्डम्','युद्धकाण्डम्','उत्तरकाण्डम्']
KANDA_NAMES=['Bala Kanda','Ayodhya Kanda','Aranya Kanda','Kishkindha Kanda','Sundara Kanda','Yuddha Kanda','Uttara Kanda']

def slp1(text):
    vowels=dict(zip('aAiIuUfFxXeEoO','अआइईउऊऋॠऌॡएऐओऔ'))
    signs=dict(zip('aAiIuUfFxXeEoO',['','ा','ि','ी','ु','ू','ृ','ॄ','ॢ','ॣ','े','ै','ो','ौ']))
    consonants=dict(zip('kKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL','कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ'))
    out=[];pending=False
    for ch in text:
        if ch in vowels:
            out.append(signs[ch] if pending else vowels[ch]);pending=False
        elif ch in consonants:
            if pending:out.append('्')
            out.append(consonants[ch]);pending=True
        else:
            if pending:out.append('्');pending=False
            out.append({'M':'ं','H':'ः',"'":'ऽ','~':'ँ','|':'।'}.get(ch,ch))
    if pending:out.append('्')
    return ''.join(out)

class Plain(HTMLParser):
    def __init__(self):super().__init__();self.out=[]
    def handle_starttag(self,tag,attrs):
        if tag in {'br','p','div','tr','td'}:self.out.append('\n')
    def handle_endtag(self,tag):
        if tag in {'p','div','tr','td','poem'}:self.out.append('\n')
    def handle_data(self,data):self.out.append(data)

def wiki_text(raw):
    poems=re.findall(r'<poem[^>]*>(.*?)</poem>',raw,re.S|re.I)
    if not poems:
        # Some source revisions use preformatted verse and omit closing tags.
        # Stop at their explicit source/audio section, never include navigation.
        poems=re.findall(r'<pre[^>]*>(.*?)(?:</pre>|</poem>|==\s*स्रोतः\s*==|$)',raw,re.S|re.I)
    if not poems:
        # One historical sarga uses only a bold Sanskrit title and BR lines.
        # These explicit markers bound the verse, excluding audio/source notes.
        match=re.search(r"('''श्रीमद्वाल्मीकियरामायणे.*?)==\s*स्रोतः\s*==",raw,re.S)
        if match:poems=[match[1]]
    if not poems:raise ValueError('Sarga has no explicit original-text poem/pre block')
    text='\n\n'.join(poems)
    text=re.sub(r'<!--.*?-->','',text,flags=re.S)
    text=re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]',r'\1',text)
    text=text.replace("'''",'').replace("''",'')
    if '{{' in text or '}}' in text:raise ValueError('Unresolved source template inside original text')
    parser=Plain();parser.feed(text)
    return '\n'.join(line.strip() for line in ''.join(parser.out).splitlines()).strip()

def write_book(book,manifest):
    name=book['id']+'.json';raw=(json.dumps(book,ensure_ascii=False,indent=2)+'\n').encode('utf8')
    (DEST/name).write_bytes(raw);manifest['outputs'][name]=hashlib.sha256(raw).hexdigest()

def main():
    manifest=json.loads((DEST/'manifest.json').read_text(encoding='utf8'))
    evidence=json.loads((SOURCE/'library-licence-evidence.json').read_text(encoding='utf8'))
    if [row['parva'] for row in evidence]!=list(range(1,19)):raise ValueError('All eighteen source licences must be checked')
    manifest['licenceEvidence']=evidence
    book={'id':'mahabharata','title':'Mahabharata','language':'sa','chapters':[],
          'sourceKeys':['mahabharata'],'licences':['MAHABHARATA-LICENCE.txt'],
          'editionNote':'The Sanskrit Library electronic critical-edition witness, continuous text, transcribed from SLP1 into Devanagari. This numbering differs from vulgate editions. Original encoded rows and source hashes are retained; no Hindi translation or new critical text is asserted.'}
    for part in range(1,19):
        path=SOURCE/'library-mahabharata'/f'mbh{part:02}.json';raw=path.read_bytes()
        manifest['inputs']['library-'+path.name]=hashlib.sha256(raw).hexdigest()
        chapter=None;buffer=[]
        def finish():
            if chapter is None:return
            original='\n'.join(buffer).strip()
            if not original:raise ValueError(f'Empty Mahabharata chapter {part}.{chapter}')
            number=len(book['chapters'])+1
            book['chapters'].append({'number':number,'title':f'{PARVAS[part-1]} Parva — Chapter {chapter}',
                'group':f'{part}. {PARVAS[part-1]} Parva','sourceChapter':chapter,'sourceUrl':f'https://sanskritlibrary.org/catalogsText/titus/mbh/mbh{part:02}.html',
                'passages':[{'id':f'mbh-{part}-{chapter}','label':f'{PARVAS[part-1]} {chapter}',
                  'text':slp1(original),'sourceEncoding':'SLP1','sourceText':original}]})
        seen=[]
        for row in json.loads(raw)['lines']:
            if row[0].startswith('sAdhy') and len(row)==2 and row[1].isdigit():
                finish();chapter=int(row[1]);seen.append(chapter);buffer=[]
            elif row[0].startswith('c'):
                if chapter is None:raise ValueError('Body before chapter boundary')
                buffer.append(' '.join([row[0][1:],*row[1:]]))
        finish()
        if seen!=list(range(1,len(seen)+1)):raise ValueError(f'Missing/duplicate critical-edition chapter in parva {part}')
    write_book(book,manifest)
    book={'id':'valmiki-ramayana','title':'Valmiki Ramayana','language':'sa','chapters':[],
          'sourceKeys':['valmiki'],'licences':['VALMIKI-LICENCE.txt'],
          'editionNote':'Sanskrit Wikisource electronic witness, seven kandas and 645 sargas in this numbering. Source revision and page attribution retained per sarga. Source transcription variants may exist; no Hindi translation or critical-edition certification is asserted.'}
    rows=[]
    for path in sorted((SOURCE/'ramayana').glob('*.json')):
        raw=path.read_bytes();manifest['inputs']['valmiki-'+path.name]=hashlib.sha256(raw).hexdigest()
        rows.extend(json.loads(raw)['query']['pages'].values())
    counts=[77,119,75,67,68,128,111]
    indexed={}
    for row in rows:
        match=re.fullmatch(r'रामायणम्/(.+)/सर्गः\s*(\d+)',row['title'])
        if not match:raise ValueError('Unexpected source page')
        key=(KANDAS.index(match[1])+1,int(match[2]))
        if key in indexed:raise ValueError('Duplicate sarga')
        indexed[key]=row
    if set(indexed)!={(k,s) for k,count in enumerate(counts,1) for s in range(1,count+1)}:raise ValueError('Incomplete seven-kanda source inventory')
    for (k,s),row in sorted(indexed.items()):
        revision=row['revisions'][0];text=wiki_text(revision['slots']['main']['*'])
        if len(text)<80:raise ValueError('Empty/short sarga')
        number=len(book['chapters'])+1
        book['chapters'].append({'number':number,'title':f'{KANDA_NAMES[k-1]} — Sarga {s}','group':f'{k}. {KANDA_NAMES[k-1]}',
          'sourceTitle':row['title'],'sourceRevision':revision['revid'],
          'passages':[{'id':f'valmiki-{k}-{s}','label':f'{KANDA_NAMES[k-1]} {s}','text':text}]})
    write_book(book,manifest)
    manifest['sources']['mahabharata']={'url':'https://sanskritlibrary.org/catalogsText/titus/mbh/mbh01.html','label':'The Sanskrit Library, Peter M. Scharf and Matthias H. Ahlborn (2010), TITUS/Muneo Tokunaga critical-edition electronic text','licence':'CC BY-NC-SA 3.0'}
    manifest['sources']['valmiki']={'url':'https://sa.wikisource.org/wiki/रामायणम्','label':'Sanskrit Wikisource contributors; exact source revisions listed per sarga','licence':'CC BY-SA; see retained licence and per-page histories'}
    (DEST/'manifest.json').write_bytes((json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf8'))
    print('Imported',len(book['chapters']),'Ramayana sargas; Mahabharata includes all eighteen downloaded parvas')

if __name__=='__main__':main()
