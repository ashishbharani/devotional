# Panchanga calculation and validation

The application remains a static MkDocs site. All astronomy runs locally in one
module worker; there is no runtime Panchanga API or copied calendar data.

## Audit of the previous implementation

The pinned bundle contains `@ishubhamx/panchangam-js 3.0.0`, Astronomy Engine
2.1.19 and Luxon 3.6.1. It already chose the sunrise tithi, but its transition
arrays clipped starts to sunrise and ends to the next sunrise, advanced a minute
after each root, and searched for tithi starts from only 25 hours earlier. The
adapter preserved those clipped intervals. The monthly renderer used only the
first interval and hid timing text on phones. Repeated/skipped sunrise flags,
Vijaya, Godhuli, true tithi starts, and a matching homepage disclosure were absent.

## Modules and data contract

- `panchang-engine.mjs`: unchanged pinned bundle plus a small explicit export of
  its existing Astronomy Engine instance and Lahiri function. The readable export
  at the end must be retained if the vendor bundle is regenerated.
- `astronomy.mjs`: geocentric ecliptic-of-date longitudes and shared Sun/Moon rise/set searches.
- `tithi.mjs`: wrapped-angle bracket/bisection solver and full limb intervals.
- `muhurta.mjs`: the four documented solar rules.
- `date-time.mjs`: validated civil dates and explicit IANA conversions.
- `panchang-adapter.mjs`: normalized sunrise-day model, metadata, caches, existing
  calendar/festival policy, and opt-in diagnostics.
- `panchang-worker.mjs` / `panchang-client.mjs`: reusable asynchronous worker.
- `panchang-display.mjs` / `panchang-app.mjs`: presentation and existing controls.

`tithis`, `tithiSegments` and the compatibility `tithiTransitions` field now hold
full astronomical starts and ends. `withinDay` holds their intersection with
`[sunrise, nextSunrise)`. `sunriseTithi` and `tithiAtSunrise` refer to the principal
interval. `nextTithi` is available even if it starts after the next sunrise.
`presentAtSunrise`, `skippedAtSunrise` and `repeatedAtSunrise` are interval flags.
Kshaya is contained between consecutive sunrises; Vriddhi covers two consecutive
sunrises, considering both the previous and next sunrise. No segment count cap
is imposed. All existing Nakshatra, Yoga, Karana, calendar-convention, Moon-event,
festival and inauspicious-period fields are retained.

## Astronomical conventions and precision

Tithi is `floor(normalize360(Moon - Sun) / 12)`, using the same bundled engine's
geocentric tropical longitudes. Ayanamsha cancels in the separation. Nakshatra
subtracts the existing Lahiri/Chitrapaksha polynomial once; Yoga subtracts it once
from each longitude. It is evaluated at each root trial, rather than frozen for
the whole day. Existing names, including **Prathama** (Pratipada), are retained.

Boundaries are bracketed in three-hour steps and bisected to a 250 ms bracket.
There is a 96-hour search horizon to detect invalid ephemeris results; it is not
a cap on transitions. Full starts are searched backward, including long tithis.
Adjacent segments share exactly the same boundary instant. The numerical solver
precision is **not** a claim of subsecond physical astronomical accuracy. Display
times round to the nearest minute; independent reference differences are below.

Solar calculations use Astronomy Engine `SearchRiseSet`: apparent upper limb,
standard refraction, observer altitude, and an unobstructed level horizon. Civil
day bounds are calculated from the location's IANA timezone, including DST. One
cached solar model supplies tithi-day boundaries, Rahu, Yamaganda, Gulika and all
four Muhurtas. Polar dates without the required solar events report unavailable
calculations; no sunrise or Panchanga values are invented.

Delhi remains the default; preferences are retained. Indian city presets use
Asia/Kolkata. Device coordinates use the device timezone, displayed in an editable
IANA timezone control so travel or manually configured devices can be corrected.
Coordinates alone do not reliably identify political timezone boundaries. Today
uses the selected timezone and updates when its local date changes.

## Moonrise and Moonset: local civil dates

`moonEvents(dateKey, location)` uses the **same bundled Astronomy Engine** as
the existing Sun and limb calculations; no second dependency or runtime API is
introduced. An observer includes the selected latitude, longitude and altitude.
Both directions are searched independently from location-local midnight converted
to UTC, not UTC midnight or sunrise. Search results are accepted only inside
`[local midnight, next local midnight)` and only if their location-local date
equals `dateKey`. A two-day search horizon accommodates 25-hour DST civil dates;
it does not allow accepting a following-day event. A missing event remains null.
Moonset before Moonrise is valid. The obsolete wrapper probes at 00:01 and 23:58
are removed, avoiding redundant full Panchanga calculations.

The existing cached daily result holds `moonrise` and `moonset` as Date-or-null
values. Today, Daily, and precomputed Monthly all consume these same fields.
The homepage adds two existing-style tiles beside Sunrise/Sunset; Daily and
Monthly retain their existing astronomical rows. All use the same local AM/PM
minute formatter and explicit no-event wording. No 24-hour setting currently
exists. No Moon calculation occurs during rendering. Cache keys already include
date, coordinates, altitude and timezone, and the calculation version is bumped.

Moon searches use apparent upper-limb rise/set with standard atmospheric
refraction and a level horizon, as documented by
[Astronomy Engine](https://github.com/cosinekitty/astronomy/blob/v2.1.19/source/js/astronomy.ts).
Actual terrain and atmospheric conditions can alter observed times.

Independent test-only minute observations from the
[USNO documented Sun/Moon service](https://aa.usno.navy.mil/data/api.html) cover
six cities and multiple lunar phases/months. Exact coordinates and request URLs
are in `scripts/fixtures/moon-reference.mjs`. The largest difference across all
four events is 34.1 seconds; the explicit test tolerance is 90 seconds to account
for minute-rounded reference values and the service's lack of observer altitude.
Delhi 2026-01-10 has no Moonrise; Delhi 2026-01-25 has no Moonset in both engines.
Delhi 2026-10-03 has Moonrise 11:27 PM and Moonset 01:09 PM. Drik's page shows
23:32/13:04 with slightly different coordinates and an unspecified Moon horizon
convention. We report that difference rather than tuning offsets to match it;
USNO independently agrees with this implementation's apparent-horizon model.

For a development-only table of date, location, coordinates, elevation, timezone
and all four local times, import `printRiseSetValidation` from the adapter and
pass a calculated day, or run `PANCHANG_DEBUG_RISE_SET=1 node
scripts/test_panchang.mjs` (use `$env:PANCHANG_DEBUG_RISE_SET='1'` in PowerShell).
The diagnostic is never invoked by the production UI.

The expanded suite covers a six-city/six-date lunar matrix, exact civil date
membership, independent missing-event references, Moonset-before-Moonrise, IST
and DST boundaries, elevation, and fresh Daily versus precomputed Monthly
agreement. A pre-change SHA-256 regression checksum verifies exact preservation
of Sun events, all four complete limb intervals and Muhurtas across 18 cases.
Browser tests verify home-location changes, date changes, no-event rendering,
all three views, five widths, themes, initialization failure and offline use.

## Muhurta conventions

The preceding sunset-to-sunrise night and sunrise-to-sunset daylight each have
15 equal divisions:

| Muhurta | Rule |
| --- | --- |
| Brahma | Penultimate night division: sunrise minus 2/15 to minus 1/15 of the preceding night. Preserves the existing defensible rule. |
| Abhijit | Eighth daylight division: sunrise plus 7/15 to 8/15 of daylight. |
| Vijaya | Eleventh daylight division: sunrise plus 10/15 to 11/15 of daylight. |
| Godhuli | One fixed ghati centred on apparent sunset: sunset minus 12 minutes to plus 12 minutes. |

Godhuli traditions differ. The sunset-centred convention is described by
[AstroSight](https://astrosight.ai/godhuli-muhurta) and
[GoToAstro](https://gotoastro.com/blogs/why-is-godhuli-vela-the-best).
Drik Panchang's tested Godhuli windows begin near sunset and extend mainly after
it. We compared both endpoints, investigated the consistent 9–12 minute shift,
and kept the explicitly stated sunset-centred rule. We do not label these as
matching Drik or inflate an accuracy tolerance to hide the difference.
Some traditions omit Abhijit on Wednesday; the requested geometric interval is
still displayed every day, rather than applying an unrequested ritual exclusion.

## Independent validation

Nine location/date samples were manually read from the visible
[Drik Panchang daily pages](https://www.drikpanchang.com/panchang/day-panchang.html)
on 3 October 2026. Exact dated reference instants and source URLs live in
`scripts/fixtures/panchang-independent.mjs`, used only by development tests.
The comparison covers sunrise, sunset, sunrise tithi and its ending, Nakshatra
ending, Brahma, Abhijit where published, Vijaya, and both Godhuli endpoints.
Two samples independently confirm the second tithi ending before next sunrise.

| City | Date | Largest comparable difference | Godhuli start/end shift |
| --- | --- | --- | --- |
| Delhi | 2026-10-03 | 61.6 seconds | −12 / −12 minutes |
| Mumbai | 2026-01-15 | 56.4 seconds | −10 / −12 minutes |
| Varanasi | 2026-02-15 | 76.8 seconds | −9 / −11 minutes |
| Meerut | 2026-03-15 | 56.8 seconds | −10 / −10 minutes |
| Guwahati | 2026-04-15 | 36.7 seconds | −11 / −10 minutes |
| Kolkata | 2026-05-17 | 72.8 seconds | −11 / −9 minutes |
| Bengaluru | 2026-06-15 | 65.4 seconds | −12 / −10 minutes |
| Chennai | 2026-07-15 | 83.9 seconds | −10 / −9 minutes |
| Ujjain | 2026-08-15 | 77.3 seconds | −12 / −11 minutes |

The 120-second limit accounts for reference minute notation, small coordinate/
altitude differences, and existing ephemeris/ayanamsha conventions. It is an
observed sample tolerance, not a worldwide or all-date guarantee. The retained
previous fixtures add four October 2 samples and Moonrise/Moonset checks.

## Regression checks and offline updates

Run `node scripts/test_panchang.mjs`, `uv run mkdocs build --strict`,
`uv run python scripts/check_site.py`, and `uv run python scripts/check_i18n.py`.
For browser checks, install pinned tooling with `pnpm install --frozen-lockfile`,
then `pnpm exec playwright install chromium` and `pnpm test:browser`.
`PANCHANG_SCREENSHOTS` optionally saves phone/tablet/desktop evidence;
`PANCHANG_BROWSER` selects an installed browser executable.

The numerical suite covers ordinary, shortly-after-sunrise, midnight, Kshaya,
Vriddhi, multiple-transition, month/year/leap and timezone cases. Synthetic
accelerated/slow angles exercise solver extremes only; they are never production
astronomy. Browser checks cover the timezone-local homepage, keyboard/ARIA,
existing disclosures, true dates, daily/monthly views, city changes, four
Muhurtas, 320/360/390/768/1440 px layouts, Material instant navigation, denied
geolocation, light/dark/high-contrast layouts, errors and module-load failure.
A real-browser old-worker migration check verifies cache deletion, page reload
and offline calculation with the new engine. CI runs
these checks before Pages deployment and publishes screenshot artifacts on PRs.

Cache keys include calculation version, date, coordinates, altitude, timezone,
calendar convention and the Lahiri/Astronomy Engine version. PWA cache signatures
include **every** Panchanga module and worker. Those modules are served together
from the current shell cache, and old scoped caches are deleted on activation.
Open Panchanga pages reload on a cache migration so an old in-memory engine
cannot continue displaying stale calculations.

For diagnostics, import `inspectPanchang` from `panchang-adapter.mjs` and pass a
calculated day. It returns UTC Julian date, local timestamp, Sun/Moon longitude,
elongation, index, transition target/JD, sunrise/sunset and timezone metadata.
No debug information appears in the normal interface.
