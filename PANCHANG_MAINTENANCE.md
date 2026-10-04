# Panchang maintenance

The Panchang is a client-side enhancement. Calculations never send a reader's
city or browser geolocation to a calculation service. Explicit online place
search sends the typed query to the configured geocoder; presets work offline. The
default location is Delhi, India, and preferences are stored in
`localStorage` under `abp-panchang-settings-v1`.

## Shared location workflow

`location-controls.mjs` provides explicit Indian place search, device location
and manual-coordinate application for every Panchang view and Ephemeris.
Presets and explicitly selected search results persist through the existing
settings key and synchronize via custom/storage events. Device and explicitly
applied manual locations share the same state **in memory only**, across active
components and Material instant navigation. Reload/full navigation restores
the saved city; precise coordinates are not stored or propagated to other tabs.
Legacy persisted `device` locations are replaced with Delhi on load. Editing
Ephemeris fields alone and share URLs remain local overrides; the explicit
Apply button shares manual coordinates for this document session.

Unknown elevation is identified by `altitudeKnown: false`; engines receive a
documented neutral 0 m fallback, not a claimed measured elevation. Coordinates
cannot determine timezone: device/manual users must verify the visibly retained
IANA zone. Indian search results use Asia/Kolkata (+330 minutes); historical
calculation offsets still come from the original date-sensitive engines.
GPS is requested only on button press, with high accuracy, a 15-second timeout
and maximum age 60 seconds. Errors preserve the previous location; stale
callbacks/searches are discarded, removed views unsubscribe and abort searches.
Read coordinate properties explicitly: browser `GeolocationCoordinates` uses
WebIDL getters, so object spread does not reliably copy latitude/longitude.
Regression tests include non-enumerable getters and Playwright's real browser
geolocation API with synthetic coordinates; no real device location is tested.
Enter in the place field applies a known offline preset or submits an explicit
online search. Other searches still require choosing a result explicitly.

The default low-volume provider is public Nominatim. Its policy forbids network
autocomplete, so the selector requires an explicit Search click (minimum three
characters), limits to six Indian results, never automatically resolves
ambiguity, and caches up to 50 successful searches per document. Requests are
delayed/throttled within the document and abortable, with a rate-limit cooldown.
No bulk or background geocoding or reverse lookup occurs. Attribution and query
privacy disclosure are visible. The public service's **application-wide** limit
is one request/second; a static client cannot enforce that across all visitors.
For higher traffic switch `location-search.json` to a compatible hosted/proxied
service before enabling broader use. Endpoint and attribution can be changed
without changing JavaScript. Policy: https://operations.osmfoundation.org/policies/nominatim/.

Regression coverage is in `test_location_controls.mjs`, settings tests and
`test_location_workflow_browser.mjs` (called by the existing browser suite);
provider requests are mocked, never used for bulk automated tests.

## Architecture

- `hooks/generate.py` emits the homepage card and the three generated tool pages.
- `docs/javascripts/abp-panchang.js` is the small Material instant-navigation loader.
- `docs/assets/panchang/settings.mjs` owns the canonical site location and saved preferences under `abp-panchang-settings-v1`. City presets synchronize the complete coordinates, elevation and timezone across homepage/daily/monthly Panchang, the converter and Ephemeris. `subscribeSettings()` listens to same-document custom events and cross-tab storage events; removed views unsubscribe. Malformed storage falls back to Delhi. Location changes clear Panchang caches and invalidate older asynchronous runs.
- `docs/assets/panchang/date-time.mjs` is the canonical civil-date, IANA-timezone and Hindu-day utility layer.
- `docs/assets/panchang/panchang-adapter.mjs` validates and normalizes the bundled engine into daily/monthly models.
- `docs/assets/panchang/festival-rules.mjs` separates festival policy from astronomical calculations.
- `docs/assets/panchang/festival-links.mjs` is the curated mapping into the existing collection.
- `docs/assets/panchang/panchang-app.mjs` owns presentation, calendar and converter workflows.
- `docs/assets/panchang/panchang-engine.mjs` is the pinned, minified calculation bundle.

The engine bundle contains `@ishubhamx/panchangam-js` 3.0.0,
`astronomy-engine` 2.1.19 and `luxon` 3.6.1. All are MIT licensed; notices are
in `docs/assets/panchang/THIRD_PARTY_NOTICES.txt`. It is loaded only when a
Panchang element exists on the current page.

Do not hand-edit `panchang-engine.mjs`. It is third-party generated code. Keep
project-specific corrections in the adapter and rebuild the vendor bundle only
when intentionally upgrading pinned dependencies.

## Calculation conventions

- **Astronomy:** Astronomy Engine 2.1.19 supplies apparent solar/lunar
  positions and rise/set searches. Its rise/set definition uses the first/last
  visible upper limb with standard atmospheric refraction.
- **Ayanamsha:** the bundled package's default `getAyanamsa()` implementation is
  Lahiri/Chitra Paksha. The UI does not currently expose another ayanamsha.
- **Hindu day:** the adapter models a day from location-local sunrise through
  the following location-local sunrise. Tithi, Nakshatra, Yoga and Karana shown
  as the day's primary state are the states prevailing at sunrise. Every
  transition returned inside that Hindu day is retained.
- **Civil date and timezone:** the selected Gregorian date is resolved with its
  location's IANA timezone. The numeric engine offset is calculated for that
  date; no calculation depends on the computer or build server timezone.
  The timezone is visible and editable. Geolocation retains that selected zone
  because coordinates alone do not resolve a timezone; verify it when travelling.
- **Moonrise/Moonset:** package 3.0.0 searches from location-local midnight and
  accepts only an event within that local civil date. The adapter verifies the
  date again without repeating the entire Panchang calculation. It never
  borrows an adjacent day's event. A null value is retained when the roughly
  24h50m lunar cycle produces no rise or set during that civil date.
- **Lunar month:** the package derives the Amanta month from the sidereal solar
  sign at the relevant new moon, detects Adhika Masa when consecutive new moons
  fall in the same sign, and applies its Purnimanta month adjustment. Switching
  convention must not change astronomical events.
- **Caching:** deterministic raw and normalized results are keyed by civil date,
  latitude, longitude, altitude, IANA timezone and calendar convention. Cache
  state is cleared when a user changes location or convention.

## Festival scope

Astronomical fields and festival rules are distinct. The UI shows only
point festivals emitted by the pinned rules engine, plus explicit Tithi markers
for Ekadashi, Purnima and Amavasya. Multi-day span labels are excluded because
independent checking found regional/day-number differences. The UI always warns that observance can vary by
region and tradition. Devotional links are curated separately and never alter
the canonical collection data.

Package festival output is labelled as rule-based and requiring regional review;
it is not presented as a universally authoritative festival ruling. The Tithi
markers describe astronomical sunrise state, not a complete vrata decision.

## Validation

The maintained golden fixture in `scripts/fixtures/panchang-golden.mjs` checks
2 October 2026 against small, manually transcribed Drik Panchang reference rows
for Delhi, Mumbai, Chennai and Guwahati. It compares sunrise, sunset,
Moonrise, Moonset, Tithi, Tithi end, Nakshatra, Nakshatra end, Paksha and Masa.
Sunrise/sunset and transition tolerances are two minutes; lunar rise/set uses a
seven-minute tolerance because observer coordinates and refraction models differ.
The fixture records each source URL and must not be changed merely to make a
failing implementation pass.

Regression coverage also includes genuine Delhi no-Moonrise/no-Moonset civil
dates, DST-sensitive IANA offset conversion, Adhika Masa, confirmed skipped and
repeated sunrise Tithis, twelve city presets, leap/year boundaries and complete
October 2026 monthly generation for seven geographically separated cities.
The new `moonrise-native.json` fixture independently checks 42 date/city cases
against official native Swiss Ephemeris 2.10.03 `swe_rise_trans`, not the browser
Panchang engine. Six cities and seven phase/season dates agree on absent events;
the maximum observed lunar-event difference was 6.658 seconds. A two-minute
cross-engine tolerance allows different standard refraction implementations;
no fitted offsets are applied. Regenerate with
`python scripts/generate_moon_reference.py --dll path/to/swedll64.dll`.

Run:

```powershell
node scripts/test_panchang.mjs
node scripts/validate_moonrise.mjs 2026-10-03
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
