"""Check draft passage identity/coverage; never certify or publish translations."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
drafts = ROOT / "review" / "reader-translation-drafts"
for path in sorted(drafts.glob("*/chapter-*.json")):
    document = json.loads(path.read_text(encoding="utf-8"))
    assert document["status"] == "draft", path
    original = ROOT / "data" / "reader-books" / (document["book"] + ".json")
    raw = original.read_bytes()
    assert document["sourceSha256"] == hashlib.sha256(raw).hexdigest(), path
    book = json.loads(raw)
    chapter = next(c for c in book["chapters"] if c["number"] == document["chapter"])
    expected = {p["id"]: p["text"] for p in chapter["passages"]}
    assert set(document["passages"]) == set(expected), "Missing/extra chapter passage"
    for passage_id, unit in document["passages"].items():
        assert unit["sourceSha256"] == hashlib.sha256(expected[passage_id].encode("utf-8")).hexdigest()
        for code in ("en", "hi"):
            assert isinstance(unit[code], str) and unit[code].strip(), (passage_id, code)
            assert unit[code] != expected[passage_id], (passage_id, code)
    print(f"PASS draft {document['book']} chapter {document['chapter']}: "
          f"{len(expected)} source-pinned Hindi/English pairs; NOT linguistic approval")

# A draft must never enter the production pack collector or generated assets.
import sys
sys.path.insert(0, str(ROOT))
from hooks.reader_books import load_books
from hooks.reader_translations import collect
_, assets = collect(load_books())
for path in drafts.glob("*/chapter-*.json"):
    assert path.read_text(encoding="utf-8") not in assets.values()
