"""Test fictional Reader translation fixtures in a temporary folder only.

No synthetic translation or reviewer record may enter production assets.
"""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from hooks.reader_books import load_books, render, pages
from hooks import reader_translations as tr

books=load_books()
book=books[0]
passage=book["chapters"][0]["passages"][0]
manifest=json.loads((tr.ROOT/"data/reader-books/manifest.json").read_text(encoding="utf-8"))
outputsha=manifest["outputs"][book["id"]+".json"]
draft={
    "schema":1, "book":book["id"], "language":"hi",
    "sourceSha256":outputsha, "status":"reviewed",
    "review":{
        "reviewer":"SYNTHETIC TEST REVIEWER",
        "reviewedOn":"2026-11-05",
        "evidence":"https://example.test/test-review-only",
        "rightsNote":"Synthetic fixture; not for release."
    },
    "translations":{
        passage["id"]:{
            "sourceSha256":tr.digest(passage["text"]),
            "text":"यह केवल एक परीक्षण हेतु काल्पनिक हिंदी अनुवाद है।"
        }
    },
}
with TemporaryDirectory() as temporary:
    root=Path(temporary)
    location=root/book["id"]
    location.mkdir()
    p=location/"hi.json"
    with patch.object(tr,"DATA",root):
        index,assets=tr.collect(books)
        assert not assets and not index["books"][book["id"]]["languages"]
        p.write_text(json.dumps(draft,ensure_ascii=False),encoding="utf-8")
        index,assets=tr.collect(books)
        entry=index["books"][book["id"]]["languages"]["hi"]
        assert entry["reviewedPassages"]==1
        assert entry["totalPassages"]==701
        assert entry["sourceSha256"]==outputsha
        assert entry["path"] in assets
        inventory=tr.review_inventory(books)
        assert inventory["books"][book["id"]]["languages"]["hi"]["missingPassages"]==700
        assert inventory["books"][book["id"]]["languages"]["mr"]["missingPassages"]==701
        assert "data-reader-source-sha256" in render(book,pages(book)[0],pages(book))
        assert 'translate="no"' in render(book,pages(book)[0],pages(book))
        cases={
            "wrong-book":lambda x:x.update(book="invalid"),
            "stale-source":lambda x:x.update(sourceSha256="0"*64),
            "unreviewed":lambda x:x.update(status="draft"),
            "missing-reviewer":lambda x:x["review"].update(reviewer=""),
            "invalid-review":lambda x:x["review"].update(evidence="http://example.test/unsafe"),
            "wrong-id":lambda x:x.update(translations={"unknown-id":next(iter(x["translations"].values()))}),
            "wrong-source":lambda x:next(iter(x["translations"].values())).update(sourceSha256="f"*64),
            "unchanged":lambda x:next(iter(x["translations"].values())).update(text=passage["text"]),
            "empty":lambda x:x.update(translations={}),
        }
        for name,damage in cases.items():
            broken=deepcopy(draft)
            damage(broken)
            p.write_text(json.dumps(broken,ensure_ascii=False),encoding="utf-8")
            try:tr.collect(books)
            except ValueError:pass
            else:raise AssertionError("Wrongly accepted "+name)
print("PASS sourced book passages, protection and nine-language absence/strict rejection fixtures")
