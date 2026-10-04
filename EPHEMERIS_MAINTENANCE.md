# Indian Ephemeris maintenance

The site remains MkDocs + Material, built by `hooks/generate.py` and published
under `/devotional/` by the existing GitHub Pages workflow. The new handwritten
page is `docs/tools/indian-ephemeris/index.md`; the generated Tools navigation
and home utility link point to it. No catalogue data is changed.

## Engine and source

The adapter uses genuine Swiss Ephemeris 2.10.03 through the pinned AGPL wrapper
`@kuntay/swisseph` 0.2.2, tag commit
`4c4b0f48b15d1795b44ed068e8532fd20d1e145c`. The complete distributed wrapper,
WASM, notices, source archive and two required data files are self-hosted.
Only `sepl_18.se1` and `semo_18.se1` from data package 0.2.2 are loaded:
DE441-based planetary and lunar data for UTC instants in 1800–2399.
The upstream manifest also describes files not shipped here. Those are not
required for the supported bodies/range. Each loaded data file is SHA-256
checked before calculation. Unexpected engine versions, failed checksums and
Moshier fallback all withhold results rather than display a high-precision badge.

The complete source/build archive is
`docs/assets/ephemeris/vendor/swiss-0.2.2/source-v0.2.2.tar.gz`.
SHA-256: `c2d138e83e60d21443f69566c53fa8183fa1064dbf0bd6210af80bf969309ab8`.
The original WASM hash is
`dc1b271513cfd971878bda7019ae0a48190abb8648dc90addb9ada75aba1628b`.
Source provenance: https://github.com/kuntayerkus/swisseph-wasm/tree/v0.2.2
Official engine reference: https://www.astro.com/swisseph/swephprg.htm
Licence scope and the owner's authorization are recorded in `LICENSING.md`.
Do not remove the public corresponding-source offer or third-party notices.

## Architecture and settings

- `time-conversion.mjs`: one canonical civil-time → UTC → Julian Day boundary.
  Browser IANA history is used, retaining historical offset seconds. DST gaps
  and ambiguous times require an explicit offset; they are never guessed.
- `ephemeris-engine.mjs`: raw values from `swe_calc_ut`; native sidereal modes,
  speed, optional topocentric planets and native houses. Jobs are serialized in
  a dedicated module worker so Swiss mutable settings cannot leak.
- `zodiac.mjs`: normalization, unrounded Rashi/Nakshatra/Pada classification,
  display-only truncation, motion from actual speed. Near-station threshold:
  absolute speed below 0.0001 degrees/day. Ketu is exactly opposite Rahu and
  shares its speed. Nodes remain geocentric orbital intersections even when
  planets are topocentric; node distances are not exported as physical distances.
- `monthly.mjs`: daily samples call that same raw engine, with explicitly
  selected local reference time. Optional Rashi ingresses and stations use
  hourly brackets refined to at most one second, not rounded daily positions.
- `ephemeris-app.mjs`, `csv-export.mjs`: controls, display, raw CSV, print,
  source/help, share links and harmless preferences. Precise device coordinates
  remain session-only. Share coordinates require explicit opt-in.

The selected city preset is shared site-wide through Panchang's existing `abp-panchang-settings-v1` store. Ephemeris loads the canonical city, subscribes to changes and broadcasts preset selections back to Panchang. The full location record travels together; all Ephemeris modes retain it. Ephemeris preferences contain calculation options only. Manual coordinates, explicit share-link coordinates and precise device geolocation remain local overrides and never update the persistent city. A new canonical city selection supersedes a local override, terminates the obsolete worker and recalculates the current mode. Removed views unsubscribe and terminate their worker.
- `abp-ephemeris.js`, `ephemeris.css`: page-only lazy loading and scoped theme.
  The service worker runtime-caches versioned assets without precaching this
  multi-megabyte tool on the home page.

Defaults: Lahiri/Chitrapaksha, mean node, geocentric, Asia/Kolkata,
degrees/minutes/seconds; monthly reference time 00:00 local.
Native alternatives: Raman, Krishnamurti, Yukteshwar, Fagan/Bradley, and a
tropical comparison without Nakshatra/Pada claims. Houses: Whole Sign
(default Jyotish view), Equal, Sripati and Placidus (Western comparison).

## Independent numerical verification

`scripts/generate_ephemeris_reference.py` calls official Astrodienst native
`swedll64.dll` via ctypes, not the browser wrapper. Its checked-in fixture
records the DLL version/hash, data hashes and source archive URL. The DLL hash
is `1b1645c164cdbc073408df8cd50586cea67b9c8cbf2ec8b8cee78d4706774a35`.
Reference download: https://raw.githubusercontent.com/aloistr/swisseph/master/windows/sweph.zip

72 cases cover six dates (J2000, 2024, 2026-10-03, leap, historic and future),
six zodiac modes and both observers. Tests cover both node variants, all
classical and optional modern bodies, ayanamsha, Lagna and four house systems.
Maximum observed raw longitude difference: 1.1368683772161603e-13 degrees.
Maximum speed difference: 1.3358203432289883e-8 degrees/day.
Numerical ayanamsha and house-cusp differences: zero.
Acceptance: 1e-9 degrees for positions, 2e-8 degrees/day for speed,
1e-10 AU for distance. Native topocentric speed uses short-interval numerical
derivatives, which amplify tiny floating-point position differences; this was
investigated rather than weakening position tolerances.

```powershell
node scripts/test_ephemeris.mjs
node scripts/test_panchang.mjs
uv run mkdocs build --strict
uv run python scripts/check_site.py
```

## Honest limitations

UTC approximates UT1: no IERS DUT1 bulletin is applied. Swiss supplies modelled
ΔT (TT−UT). Historical civil-time accuracy depends on the browser's timezone
database and regional records; manual offsets are provided. Leap-second input
and Julian calendar input are not supported. Date-boundary selections whose
UTC instant falls outside the loaded range fail closed. No range tab,
Nakshatra-ingress search, birth-chart interpretation or automatic refresh is
provided. Extremely brief double crossings inside an hourly interval can be
missed. Optional event search is not available in December 2399. City presets
are approximate city centres, not exact birth locations. Geolocation permission
and real devices must also be tested by the maintainer; no personal location is
obtained automatically. Production publishing occurs only after maintainer merge.

Panchang continues to use its existing MIT Astronomy Engine bundle; it is not
replaced by this planetary ephemeris. Its Moonrise/Moonset model and no-event
handling are independently regression-tested, and the home summary now displays
the existing four rise/set values using its original tile styles.
