# Panchang maintenance

The Panchang is a client-side enhancement. It never sends a reader's selected
city or browser geolocation to this site or to a calculation service. The
default location is Delhi, India, and preferences are stored in
`localStorage` under `abp-panchang-settings-v1`.

## Architecture

- `hooks/generate.py` emits the homepage card and the three generated tool pages.
- `docs/javascripts/abp-panchang.js` is the small Material instant-navigation loader.
- `docs/assets/panchang/settings.mjs` owns locations and saved preferences.
- `docs/assets/panchang/festival-links.mjs` is the curated mapping into the existing collection.
- `docs/assets/panchang/panchang-app.mjs` owns presentation, calendar and converter workflows.
- `docs/assets/panchang/panchang-engine.mjs` is the pinned, minified calculation bundle.

The engine bundle contains `@ishubhamx/panchangam-js` 3.0.0,
`astronomy-engine` 2.1.19 and `luxon` 3.6.1. All are MIT licensed; notices are
in `docs/assets/panchang/THIRD_PARTY_NOTICES.txt`. It is loaded only when a
Panchang element exists on the current page.

## Festival scope

Astronomical fields and festival rules are distinct. The UI shows only
point festivals emitted by the pinned rules engine, plus explicit Tithi markers
for Ekadashi, Purnima and Amavasya. Multi-day span labels are excluded because
independent checking found regional/day-number differences. The UI always warns that observance can vary by
region and tradition. Devotional links are curated separately and never alter
the canonical collection data.

## Validation

The Delhi result for 2 October 2026 is checked against Drik Panchang: Krishna
Shashthi to about 10:15, Mrigashira to about 02:55 the next day, Bhadrapada
(Amanta), Ashwina (Purnimanta), sunrise about 06:14, sunset about 18:06, Vikram
Samvat 2083 and Shaka Samvat 1948. Small minute-level differences can occur
between astronomical implementations.

Run:

```powershell
node scripts/test_panchang.mjs
uv run mkdocs build --strict
uv run python scripts/check_site.py
```

When upgrading the vendored engine, review its API, browser behavior and
licence again; update this document, the third-party notice and the pinned
versions together. Do not replace the bundle from an unpinned CDN.

## Reversibility

The exact site before this feature is tagged `PRE-PANCHANG-STABLE`. The tag
must not be moved or deleted. See the pull request report for safe preview,
merge and restore commands.
