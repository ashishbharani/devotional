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
    require(home.count('<details class="abp-home-index') == 2, "homepage must have matching Library and Religious Music disclosures", errors)
    require('class="abp-home-index abp-home-library"' in home, "homepage Library disclosure is missing", errors)
    require('<details class="abp-home-index"' in home, "homepage index is not a native details element", errors)
    require('<details class="abp-home-index" open' not in home, "homepage Religious Music control must start collapsed", errors)
    require('<details class="abp-home-index abp-home-library" open' not in home, "homepage Library control must start collapsed", errors)
    require('data-i18n="index">Religious Music</span>' in home, "Religious Music label is missing", errors)
    for route in ("foreword/", "disclaimer/", "find/", "a-z/", "library/", "master-index/"):
        require(f'href="{route}"' in home, f"homepage does not link to {route}", errors)
    require('href="japa-counter/"' in home, "homepage does not link to the Japa counter", errors)
    require('class="abp-home-utility"' in home, "homepage Japa utility control is missing", errors)
    require("abp-install" not in home, "retired install UI remains on the homepage", errors)
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
        for place, *_ in works.get("places", [])[:: max(1, len(works.get("places", [])) // 6)]:
            path = place.split("#", 1)[0].strip("/")
            require((site / path / "index.html").is_file(), f"canonical work location is missing: {path}", errors)

    worker = (site / "sw.js").read_text(encoding="utf-8")
    require("addEventListener(\"fetch\"" not in worker, "cleanup worker must not intercept requests", errors)
    require('startsWith("abp-")' in worker, "cleanup worker is not scoped to abp-* caches", errors)
    require(not (site / "manifest.webmanifest").exists(), "retired web manifest was generated", errors)
    require(not (site / "assets" / "offline-packs.json").exists(), "retired offline packs were generated", errors)

    if errors:
        print("Site smoke-check failures:")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(f"Site smoke checks passed: {len(ROUTES)} routes, 43,085 indexed works, sampled canonical work pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
