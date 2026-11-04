"""Explicit maintenance download, never called by MkDocs or browser code.

Fetches the published Library reader data and exact Wikisource revisions pinned
in the committed Ramayana database. Resume-safe; review source/output hashes
after running import_reader_epics.py. No credentials or insecure TLS required.
"""
import hashlib,json,time,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
TARGET=ROOT/'work/wiki-epics'
AGENT='HDCReader/1.0 (https://github.com/ashishbharani/devotional)'

def fetch(url):
    request=urllib.request.Request(url,headers={'User-Agent':AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request,timeout=120) as response:return response.read()
        except Exception:
            if attempt==3:raise
            time.sleep(3*(attempt+1))

def main():
    folder=TARGET/'library-mahabharata';folder.mkdir(parents=True,exist_ok=True)
    evidence=[]
    for part in range(1,19):
        url=f'https://sanskritlibrary.org/catalogsText/titus/mbh/mbh{part:02}.html'
        terms=fetch(url)
        if b'creativecommons.org/licenses/by-nc-sa/3.0' not in terms:raise ValueError('Source licence changed; review before importing')
        evidence.append({'parva':part,'url':url,'sha256':hashlib.sha256(terms).hexdigest(),'licence':'CC BY-NC-SA 3.0'})
        path=folder/f'mbh{part:02}.json'
        if not path.exists():
            query=urllib.parse.urlencode({'text':f'titus/mbh/mbh{part:02}','texttype':'forTranslation'})
            raw=fetch('https://sanskritlibrary.org/LoadText?'+query);assert json.loads(raw)['lines'];path.write_bytes(raw)
        print('Mahabharata',part,flush=True);time.sleep(1)
    (TARGET/'library-licence-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf8')
    book=json.loads((ROOT/'data/reader-books/valmiki-ramayana.json').read_text(encoding='utf8'))
    chapters=sorted(book['chapters'],key=lambda c:c['sourceTitle']);folder=TARGET/'ramayana';folder.mkdir(exist_ok=True)
    for start in range(0,len(chapters),20):
        path=folder/f'{start:04}.json'
        if not path.exists():
            params={'action':'query','format':'json','prop':'revisions','rvprop':'content|ids|timestamp','rvslots':'main','revids':'|'.join(str(c['sourceRevision']) for c in chapters[start:start+20])}
            response=json.loads(fetch('https://sa.wikisource.org/w/api.php?'+urllib.parse.urlencode(params)))
            if 'error' in response:raise ValueError(response['error'])
            path.write_text(json.dumps(response,ensure_ascii=False),encoding='utf8')
        print('Ramayana',start,flush=True);time.sleep(1)

if __name__=='__main__':main()
