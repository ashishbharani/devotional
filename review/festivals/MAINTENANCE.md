# Development preview, maintenance and rollback

## Current release boundary

This branch is incomplete. Do not enable the preview in `deploy.yml`, merge,
or deploy. The registry contains source-checked city/tradition references; its
release policy is OFF and comprehensive coverage remains incomplete.
V1's owner-approved 2027 civil-day record is unchanged, not silently promoted
to an overnight or multi-day religious period. Research candidates and claims
live outside `docs/` and are never fetched by the runtime.

Local review build (PowerShell):

```powershell
$env:HDC_PRACTICE_PREVIEW='1'
$env:HDC_LIVING_FESTIVAL_PREVIEW='1'
uv run mkdocs build --strict
pnpm exec node scripts/test_living_festival_browser.mjs
```

The independent flag replaces the V1 panel/engine only in that explicit build.
The normal build/deployment keeps V1. Never load both engines together.
`living-policy.json` remains disabled even in the preview; only explicit,
labelled visual previews are available while release is disabled. Browser tests
use fictional edge cases and actual bundled references in isolated offline tests;
only a local test-server policy enables those references.

## Architecture and data contract

- `living-scheduler.mjs`: pure selection with injected `clock`. Clock strings
  need an offset (or a UTC civil date); modern Indian dates use UTC+05:30.
  Inclusive periods activate at start minus seven IST calendar days. Stages:
  -7…-4 anticipation, -3…-1 approach, start…end celebration.
- `living-registry.json`: schema 2, explicit region IDs/names, supported themes,
  families with exactly one base `theme`, reviewed `windows` and `members`.
  Unsupported family art directions cannot activate. No inference from member
  days, titles, a holiday duration, approximate festival length or lunar rules.
- A window needs unique stable `id`, `family`, `theme`, `name`, `tradition`,
  `regions`, `priority` (0–100), valid ISO `start`/`end`, `status:'verified'`,
  `approval:{approved:true,reviewer,reviewedOn}` and nonempty HTTPS `sources`
  containing `url`, `label`, `reviewedOn`. A member also explicitly identifies
  its `windowId`; it cannot extend that window or leak a regional variation
  into a different tradition's period. All approvals must be real reviews.
- `living-policy.json`: schema 1, `enabled`, `previewEnabled`, `disabledIds`,
  `disabledFamilies`, per-window `priorities`, `overrides`. An override refers
  to an already verified window and needs `approved:true`, named `reviewer`,
  explicit-offset `startsAt`/`expiresAt` and a valid stage. Expiry is exclusive.
  It is a version-controlled presentation override, never a religious ruling.
- Ranking is celebration first, selected region next, administrator/record
  priority descending, start date then stable ID. Nationwide includes regional
  records; a selected state admits that state plus national records. A reviewed
  national date must not be used as a shortcut around regional differences.
- Duplicate window IDs or ambiguous registry metadata fail to Original.
  Invalid individual windows are excluded with diagnostics; unsafe policy
  fails to Original. No public administration endpoint or external date API.

The runtime dynamically imports the pure modules, fetches the versioned local
registry/policy once and reevaluates at IST midnight, Material instant navigation,
pageshow, visibility restoration and cross-tab preference changes. Each page
instance has one abortable listener set and one midnight timer. It never depends
on a background timer being delivered while a tab is suspended. Offline shell
entries/signatures include V2 only in its review build. Normal builds exclude
the new runtime and V2 shell additions.

Preferences use a separate `hdc-living-festival-preferences-v2` record. Existing
V1 records and unrelated storage are not rewritten. Auto, Original, region and
animation choices are read through. Current main retired the old Ganesha/Shiva
demo modes; those saved bytes remain intact and their effective mode is Auto,
matching the approved cleanup. V2 is written only after an actual
preference change. Unsupported records are preserved; Original is the safe default,
and explicit session-only changes remain possible. Existing accessibility flags,
system reduced motion, contrast and reported data/device capabilities reduce
effects. No location permission, coordinates, analytics or autoplay audio.

Preview controls explicitly use an English `lang` fallback; translation and
linguistic review remain open. Do not claim full localized festival content.

## Annual review

Run `node scripts/audit_living_festival_coverage.mjs --write-tasks`.
The scheduled November workflow uploads a matrix and research tasks, including
the next-year gap. It has read-only repository permissions: it cannot approve,
commit or publish date changes. `--require-ready` intentionally fails now.

The matrix tasks also list incomplete inventories and their candidate IDs even
when a region already has some verified periods. One record cannot hide other
missing festivals in the same region/year. Direct source-body follow-ups and
retrieval failures are in `DIRECT_SOURCE_AUDIT.md` and its JSON register; these
are not certified complete jurisdiction inventories.

Optional, explicit source probe:

```sh
uv run python scripts/propose_festival_calendar_review.py --years 2031
uv run python scripts/test_festival_calendar_review.py
```

The manual coverage workflow offers the same opt-in probe with an explicit year.
It fetches actual publisher pages for selected supported calendar formats only,
checks title year/city/country and selected civil dates, and writes **unapproved**
facts/hashes under `work/festival-coverage/`. Wrong places/years, impossible dates,
weekday conflicts, absent or changed markup and fetch failures produce gaps.
No religious period is inferred from a single date; overnight endpoints,
traditions, source conflicts, completeness and matching visual approval require
actual review. This helper never edits `docs/`, sets approval true or deploys.
Its four initial source formats are a maintenance aid, not a festival coverage cap.

The owner accepted labelled, source-checked references for a specified city/tradition
on 2026-11-05. This is a date-source standard, not merge/deploy permission. Record
verification scope, explicit year/place URLs, fetched publication title/hash and
review date; do not imply a temple-approved or nationwide ruling. Keep dates in
the canonical registry and reference its IDs in review records.

For each candidate: inspect current primary calendar/temple/organiser sources;
record access date, place, calendar/tradition and exact civil period; corroborate
conflicts; retain alternative/regional names and specific family-day evidence.
Never transform a procurement notice's dates into observance dates. Leave missing
years, uncertain endpoints and conflicting claims unapproved with a gap reason.
Review sources independently even when their domain is governmental. No annual
Gregorian shifting, fabricated approval or automatic promotion from Panchang.

After actual review, add a window/member once to the activation registry. All
order-sensitive selection uses it; there are no hand-edited neighbouring links.
Update research status/coverage review independently of activation. Do not mark
a jurisdiction complete merely because one festival or date is recorded.

## Verification and performance

Unit tests cover stages/midnight/families/overlap/region/overrides/invalid input.
Browser fixtures cover responsive restoration, timezone-independent transitions,
instant navigation, reduced motion and real offline-shell fallback. They cannot
certify religious dates, visual/cultural approval, physical devices or field CWV.

Baseline raw data is `baseline.json`. The lab extension is invoked with
`HDC_PERFORMANCE_VARIANT=living` and `HDC_PERFORMANCE_OUTPUT` set to a report
path. It measures a synthetic celebration on matching home/find tasks, with the
same CDP throttling and real font requests. Single runs do not establish no
material regression; repeat matched measurements and physical-device motion QA
before release. Proposed budgets are in `LIVING_ENGINE_PROGRESS.md`.

## Rollback / kill switches

Visitor: choose **Restore original appearance now**; all V2 root attributes,
page decoration and hero ornaments are removed without changing content.

Maintainer: set policy `enabled:false` and `previewEnabled:false`; publish only
after review. To remove V2 entirely, unset `HDC_LIVING_FESTIVAL_PREVIEW` and
rebuild. The original panel/engine return unchanged. The existing worker updates
versioned shell caches; already-open/offline old clients need the normal update
and reload flow. No claim of remotely disabling disconnected old clients.

Before eventual release: finish coverage/cultural and artwork review, legacy
date reconciliation, all remaining family directions and localization,
matched performance acceptance and complete regression checks. Open one
consolidated PR; keep it draft until those gates are met. Maintainer approval
is required to merge/deploy.
