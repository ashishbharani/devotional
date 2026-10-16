"""Offline renderer and built-route regressions; never edits the source catalogue."""
import copy
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from hooks.generate import LIBRARY_READERS, library_content, load, page_vrat_katha_parayan


class Links(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links.append(dict(attrs))


raw = json.loads((ROOT / "data/collection.json").read_text(encoding="utf-8"))
before = copy.deepcopy(raw)
rendered = library_content(raw)
assert raw == before, "library rendering mutated source data"
assert rendered.count('class="abp-book"') == 24
books = [b for shelf in raw["library"] for b in shelf["books"]]
assert set(LIBRARY_READERS) <= {b["title"] for b in books}
links = Links(rendered).links
expected = []
for b in books:
    override = LIBRARY_READERS.get(b["title"], {})
    urls = {**b["links"], **{k: v for k, v in override.items() if k != "note"}}
    expected.extend(urls[k] for k in ("open", "english", "hindi", "listen"))
    assert urls["listen"] == b["links"]["listen"]
    if b["title"] != "Valmiki Ramayana":
        assert urls["hindi"] == b["links"]["hindi"] and urls["open"] == b["links"]["open"]
assert [a["href"] for a in links] == expected
assert all(a["href"].startswith("https://") and a["target"] == "_blank" and a["rel"] == "noopener noreferrer" for a in links)
assert 'iframe' not in rendered and 'data-book-reader' not in rendered
for route in ("index.html", "library/index.html"):
    html = (ROOT / "site" / route).read_text(encoding="utf-8")
    actual = [a for a in Links(html).links if "abp-btn" in a.get("class", "") and a.get("aria-label", "").endswith("(opens in a new tab)")]
    # Other page tools have links too: select exact existing book accessible names.
    actual = [a for a in actual if any(a["aria-label"].startswith(prefix) for b in books for prefix in ("Open " + b["title"], b["title"] + " in ", "Listen to " + b["title"] + " on YouTube"))]
    assert [a["href"] for a in actual] == expected, route

data = load()
hub = page_vrat_katha_parayan(data)
assert 'id="vrat-katha"' in hub and 'id="parayan"' in hub
assert 'find/?w=vrat' not in hub
for a in Links(hub).links:
    url = urlsplit(urljoin("https://example.test/devotional/vrat-katha-parayan/", a["href"]))
    target = ROOT / "site" / unquote(url.path.removeprefix("/devotional/")) / "index.html"
    assert target.is_file(), target
home = (ROOT / "site/index.html").read_text(encoding="utf-8")
assert 'href="vrat-katha-parayan/"' in home
assert (ROOT / "site/vrat-katha-parayan/index.html").is_file()
print("PASS: 24 books / 96 links agree on both hosts; all language overrides, unchanged Listen/Hindi/Open, immutable source, no iframe, and every hub destination exists")
