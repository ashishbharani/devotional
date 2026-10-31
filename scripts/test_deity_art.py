"""Verify approved artwork is mapped exactly, built and scoped to Category 1."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hooks.deity_art import APPROVED, PREVIEW_VERSIONS, LIFELIKE_PREVIEWS, portrait  # noqa: E402
from hooks import generate  # noqa: E402

assert len(APPROVED) == 55
assert PREVIEW_VERSIONS == {"chandra": 4, "brahma": 4, "rahu": 2, "shukra": 2}
assert len(LIFELIKE_PREVIEWS) == 20
assert LIFELIKE_PREVIEWS["bhairava"] == "bhairava-lifelike-corrected.png"
assert LIFELIKE_PREVIEWS["kamakshi"] == "kamakshi-lifelike-preview.png"
assert LIFELIKE_PREVIEWS["nataraja"] == "nataraja-lifelike-preview.png"
assert set(LIFELIKE_PREVIEWS) <= {slug for slug, _ in APPROVED.values()}
assert len(list((ROOT / "docs/assets/images/deities").glob("*.webp"))) == 110
for unapproved in ("JAGANNATH", "VARAHA", "SUDARSHANA", "VAISHNO DEVI", "SHIVA", "UNKNOWN"):
    assert portrait(unapproved) == "", unapproved
data = generate.load()
category = next(c for c in data["categories"] if c["num"] == 1)
html = generate.page_category(category)
assert html.count('class="abp-deity-portrait"') == len(APPROVED)
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
        # Nine detailed figures need a slightly larger large-image budget.
        assert source.stat().st_size < (800_000 if slug == "navagraha" else 700_000), source
    for part in (group["parts"][0], group["parts"][-1]):
        page = (ROOT / "site" / part["url"] / "index.html").read_text(encoding="utf-8")
        assert f"/{slug}-640.webp" in page, name
        assert f"3D devotional illustration of {label}" in page, name
home = (ROOT / "site/index.html").read_text(encoding="utf-8")
assert home.count('class="abp-deity-portrait"') == 10
assert "assets/images/deities/navagraha-640.webp" in home
assert home.count('class="udhc-guardian-portrait"') == 2
guardians = home.split('<div class="udhc-guardians"', 1)[1].split('</section>', 1)[0]
assert '<p class="udhc-plaque" lang="sa">श्री गणेश</p>' in home
assert '<figcaption lang="sa">॥ श्री गणेशाय नमः ॥</figcaption>' in guardians
assert '<figcaption>ॐ नमः शिवाय</figcaption>' in guardians
for slug in ("ganesha", "shiva"):
    assert f'assets/images/deities/{slug}-640.webp' in guardians
    assert f'assets/images/deities/{slug}-1254.webp' in guardians
    assert f'assets/images/royal-home/{slug}.webp' not in home
print("PASS approved deity art: 55 exact identities, 110 responsive assets, revised lifelike selections, all Category 1 mappings and section endpoints, ten homepage portraits; unavailable art excluded")
