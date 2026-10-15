"""Verify approved artwork is mapped exactly, built and scoped to Category 1."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hooks.deity_art import APPROVED, portrait  # noqa: E402
from hooks import generate  # noqa: E402

assert len(APPROVED) == 16
for unapproved in ("CHANDRA", "BRAHMA", "NAVAGRAHA", "ARDHANARISHVARA", "SHIVA", "UNKNOWN"):
    assert portrait(unapproved) == "", unapproved
data = generate.load()
category = next(c for c in data["categories"] if c["num"] == 1)
html = generate.page_category(category)
assert html.count('class="abp-deity-portrait"') == 16
for c in data["categories"]:
    if c["num"] != 1:
        assert 'class="abp-deity-portrait"' not in generate.page_category(c)
groups = {g["name"]: g for g in category["merged"]}
for name, (slug, label) in APPROVED.items():
    assert name in groups, name
    group = groups[name]
    section = next(s for s in html.split('<section class="abp-group">')[1:] if f'>{name}</span>' in s)
    assert f"/{slug}-640.webp" in section, name
    assert section.count('class="abp-deity-portrait"') == 1
    for width in (640, 1254):
        source = ROOT / f"docs/assets/images/deities/{slug}-{width}.webp"
        built = ROOT / f"site/assets/images/deities/{slug}-{width}.webp"
        assert source.read_bytes() == built.read_bytes(), source
        assert source.stat().st_size < 700_000, source
    for part in (group["parts"][0], group["parts"][-1]):
        page = (ROOT / "site" / part["url"] / "index.html").read_text(encoding="utf-8")
        assert f"/{slug}-640.webp" in page, name
        assert f"3D devotional illustration of {label}" in page, name
assert not list((ROOT / "docs/assets/images/deities").glob("chandra*"))
assert not list((ROOT / "docs/assets/images/deities").glob("brahma*"))
home = (ROOT / "site/index.html").read_text(encoding="utf-8")
assert home.count('class="abp-deity-portrait"') == 9
print("PASS approved deity art: 16 exact identities, 32 responsive assets, all Category 1 mappings and section endpoints, nine homepage portraits; unapproved art excluded")
