"""Verify every generated section neighbour against publication order."""
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from hooks.generate import load, canonical_section_navigation

data = load()
expected = [f'{part["url"]}#{form["anchor"]}'
            for cat in data["categories"] for group in cat["merged"]
            for part in group["parts"] for form in part["forms"]]
expected = list(dict.fromkeys(expected))  # repeated legacy anchors share a URL
seen = []
for url, sections in canonical_section_navigation(data).items():
    source = (Path("site") / url / "index.html").read_text(encoding="utf-8")
    match = re.search(r"data-sections='([^']+)'", source)
    assert match, url
    rendered = json.loads(html.unescape(match[1]))
    assert rendered == sections, url
    for section in rendered:
        i = len(seen)
        seen.append(url + "#" + section["anchor"])
        assert section["previous"] == (expected[i - 1] if i else None)
        assert section["next"] == (expected[i + 1] if i + 1 < len(expected) else None)
        assert f'id="{section["anchor"]}"' in source
assert seen == expected

# Synthetic insertion verifies links are derived, not manually paired.
sample = {"categories": [{"merged": [{"parts": [{"url": "a/", "forms": [
    {"anchor": "a"}, {"anchor": "b"}, {"anchor": "b2"}, {"anchor": "c"}]}]}]}]}
inserted = canonical_section_navigation(sample)["a/"]
assert inserted[1]["next"] == "a/#b2"
assert inserted[2]["previous"] == "a/#b" and inserted[2]["next"] == "a/#c"
assert inserted[3]["previous"] == "a/#b2"
print(f"PASS: {len(expected)} canonical anchor sections, all neighbours, endpoints and future insertion")
