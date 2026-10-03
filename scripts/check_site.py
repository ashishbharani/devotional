"""Post-build smoke checks for the generated static site."""

from __future__ import annotations

import json
from pathlib import Path


ROUTES = (
    "",
    "foreword",
    "disclaimer",
    "find",
    "a-z",
    "library",
    "master-index",
    "japa-counter",
    "favourites",
    "panchang",
    "hindu-calendar",
    "date-converter",
    "tools/indian-ephemeris",
    "offline",
)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    site = root / "site"
    errors: list[str] = []

    for route in ROUTES:
        page = site / route / "index.html" if route else site / "index.html"
        require(page.is_file(), f"missing route /{route}/", errors)

    home = (site / "index.html").read_text(encoding="utf-8")
    require("Hindu Devotional Collection" in home, "new site branding is missing from the homepage", errors)
    require('<meta name="author" content="Ashish Bharani">' in home, "public author metadata is incorrect", errors)
    require('<meta name="application-name" content="Hindu Devotional Collection">' in home, "application-name metadata is incorrect", errors)
    require(home.count('<details class="abp-home-index') == 2, "homepage must have matching Library and Religious Music disclosures", errors)
    require('class="abp-home-index abp-home-library"' in home, "homepage Library disclosure is missing", errors)
    require('<details class="abp-home-index"' in home, "homepage index is not a native details element", errors)
    require('<details class="abp-home-index" open' not in home, "homepage Religious Music control must start collapsed", errors)
    require('<details class="abp-home-index abp-home-library" open' not in home, "homepage Library control must start collapsed", errors)
    require('data-i18n="index">Religious Music</span>' in home, "Religious Music label is missing", errors)
    for route in ("foreword/", "disclaimer/", "find/", "a-z/", "library/", "master-index/"):
        require(f'href="{route}"' in home, f"homepage does not link to {route}", errors)
    require('href="japa-counter/"' in home, "homepage does not link to the Japa counter", errors)
    require('href="tools/indian-ephemeris/"' in home, "homepage does not link to Indian Ephemeris", errors)
    require('data-panchang-view="summary"' in home, "homepage Panchang summary is missing", errors)
    for event in ("sunrise", "sunset", "moonrise", "moonset"):
        require(f'data-panchang-field="{event}"' in home, f"homepage Panchang missing {event}", errors)
    for route in ("panchang/", "hindu-calendar/", "date-converter/"):
        require(f'href="{route}"' in home, f"homepage Panchang does not link to {route}", errors)
    require('class="abp-home-utility"' in home, "homepage Japa utility control is missing", errors)
    require("Save for Offline" not in home, "retired offline UI remains on the homepage", errors)

    directory = (site / "a-z" / "index.html").read_text(encoding="utf-8")
    require('id="abp-directory-results"' in directory, "A-Z results region is missing", errors)
    require('data-index="../assets/works-index.json"' in directory, "A-Z does not use the canonical work index", errors)

    japa = (site / "japa-counter" / "index.html").read_text(encoding="utf-8")
    for element_id in (
        "abp-japa-count",
        "abp-japa-malas",
        "abp-japa-tap",
        "abp-japa-undo",
        "abp-japa-reset",
        "abp-japa-dialog",
    ):
        require(f'id="{element_id}"' in japa, f"Japa control #{element_id} is missing", errors)

    index_path = site / "assets" / "works-index.json"
    require(index_path.is_file(), "canonical works index is missing", errors)
    if index_path.is_file():
        works = json.loads(index_path.read_text(encoding="utf-8"))
        require(len(works.get("works", [])) == 43_085, "works index count is not 43,085", errors)
        require(bool(works.get("places")), "works index has no canonical locations", errors)
        ids = [work[6] for work in works.get("works", []) if len(work) > 6]
        require(len(ids) == 43_085, "not every indexed work has a canonical ID", errors)
        require(len(set(ids)) == len(ids), "canonical work IDs are not unique", errors)
        require(all(work_id.startswith("HDL2-CWID-") for work_id in ids), "canonical work ID format is invalid", errors)
        for place, *_ in works.get("places", [])[:: max(1, len(works.get("places", [])) // 6)]:
            path = place.split("#", 1)[0].strip("/")
            require((site / path / "index.html").is_file(), f"canonical work location is missing: {path}", errors)

    worker = (site / "sw.js").read_text(encoding="utf-8")
    require("addEventListener(\"fetch\"" in worker, "PWA worker has no fetch handler", errors)
    require('startsWith("abp-")' in worker, "worker does not retire only legacy abp-* caches", errors)
    require("assets/works-index.json" not in worker.split("const scopeUrl", 1)[0], "full works index was precached", errors)
    require("ephemeris/vendor" not in worker.split("const scopeUrl", 1)[0], "large ephemeris assets must not be precached", errors)
    ephemeris = (site / "tools" / "indian-ephemeris" / "index.html").read_text(encoding="utf-8")
    require("data-ephemeris" in ephemeris and "abp-ephemeris.js" in ephemeris, "ephemeris root or lazy loader missing", errors)
    for asset in (
        "assets/ephemeris/ephemeris-app.mjs", "assets/ephemeris/ephemeris-worker.mjs",
        "assets/ephemeris/vendor/swiss-0.2.2/wasm/swisseph.wasm",
        "assets/ephemeris/vendor/data-0.2.2/sepl_18.se1", "assets/ephemeris/vendor/data-0.2.2/semo_18.se1",
        "stylesheets/ephemeris.css",
    ):
        require((site / asset).is_file(), f"ephemeris asset missing: {asset}", errors)
    manifest_path = site / "manifest.webmanifest"
    require(manifest_path.is_file(), "PWA manifest was not generated", errors)
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        require(manifest.get("name") == "Hindu Devotional Collection", "manifest full name is incorrect", errors)
        require(manifest.get("short_name") == "Hindu Devotional", "manifest short name is incorrect", errors)
        require(manifest.get("start_url") == "/devotional/", "manifest start_url is not /devotional/", errors)
        require(manifest.get("scope") == "/devotional/", "manifest scope is not /devotional/", errors)
        require(manifest.get("display") == "standalone", "manifest is not standalone", errors)
        for icon in manifest.get("icons", []):
            require((site / icon.get("src", "")).is_file(), f"manifest icon is missing: {icon.get('src')}", errors)
    require(not (site / "assets" / "offline-packs.json").exists(), "retired offline packs were generated", errors)

    favourites = (site / "favourites" / "index.html").read_text(encoding="utf-8")
    require('id="abp-favourites-page"' in favourites, "My Favourites application root is missing", errors)
    require('id="account"' in favourites, "My Favourites account section is missing", errors)
    require("abp-firebase-config.js" in favourites, "Firebase configuration module is not loaded", errors)
    require("abp-favourites.js" in favourites, "favourites module is not loaded", errors)

    panchang = (site / "panchang" / "index.html").read_text(encoding="utf-8")
    require('data-panchang-view="full"' in panchang, "Full Panchang application root is missing", errors)
    require("abp-panchang.js" in panchang, "Panchang loader is not included", errors)
    require('data-date-shift="-1"' in panchang and 'data-date-shift="1"' in panchang, "Panchang day navigation is missing", errors)
    calendar = (site / "hindu-calendar" / "index.html").read_text(encoding="utf-8")
    require('data-panchang-view="calendar"' in calendar, "Hindu calendar application root is missing", errors)
    require("data-calendar-grid" in calendar, "Hindu calendar grid is missing", errors)
    converter = (site / "date-converter" / "index.html").read_text(encoding="utf-8")
    require('data-panchang-view="converter"' in converter, "Date converter application root is missing", errors)
    require("data-convert-gregorian-button" in converter, "Gregorian converter is missing", errors)
    require("data-convert-hindu-button" in converter, "Hindu converter is missing", errors)
    for asset in (
        "assets/panchang/panchang-engine.mjs",
        "assets/panchang/panchang-app.mjs",
        "assets/panchang/panchang-adapter.mjs",
        "assets/panchang/date-time.mjs",
        "assets/panchang/festival-rules.mjs",
        "assets/panchang/settings.mjs",
        "assets/panchang/festival-links.mjs",
    ):
        require((site / asset).is_file(), f"Panchang asset is missing: {asset}", errors)

    sample_group = next(site.glob("categories/*/*/index.html"), None)
    if sample_group:
        sample_html = sample_group.read_text(encoding="utf-8")
        require('data-work-id="HDL2-CWID-' in sample_html, "generated work rows do not emit canonical IDs", errors)
        require('class="abp-favourite"' in sample_html, "generated work rows have no favourite control", errors)

    rules = (root / "firestore.rules").read_text(encoding="utf-8")
    require("request.auth != null && request.auth.uid == uid" in rules, "Firestore rules do not isolate each user", errors)
    require("allow read, write: if false" in rules, "Firestore rules have no default deny", errors)

    retired_public_text = (
        "ultimate hindu devotional collection",
        "advocate ashish bharani",
        "aadvocte ashish bharani",
        "advovate ashish bharani",
        "adv. ashish bharani",
        "adv ashish bharani",
        "made with material for mkdocs",
    )
    for page in site.rglob("*.html"):
        rendered = page.read_text(encoding="utf-8").lower()
        for retired in retired_public_text:
            require(retired not in rendered, f"retired public branding remains in {page.relative_to(site)}: {retired}", errors)

    if errors:
        print("Site smoke-check failures:")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(f"Site smoke checks passed: {len(ROUTES)} routes, 43,085 canonical work IDs, Panchang, favourites and scoped PWA shell")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
