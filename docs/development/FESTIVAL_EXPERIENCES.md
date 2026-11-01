# Festival presentation: preview-only foundation

This is not a new Panchang engine. No astronomical algorithms, dates returned by
the existing Panchang, devotional identities or canonical data are modified.

## Current availability — important

The 2026 presentation registry contains **zero reviewed observances**. Automatic
mode therefore retains the original theme. Existing rule-engine results are
explicitly marked as requiring regional review; they are not silently promoted
to verified presentation dates. No recurring Gregorian date is guessed.

Manual Ganesha/Shiva previews use existing approved portraits and collection
routes. They are visibly labelled design previews, NOT festival announcements.
Only the scoped panel changes; approved hero, navigation and reading layouts
remain intact. There is no festival audio. Effects are optional and respect both
reduced motion and the existing accessibility no-motion preference.

## Adding reviewed year data

1. Establish the precise observance identity, region and tradition. Find current
   authoritative local-calendar evidence. A government holiday alone does not
   establish a ritual observance window. Record disagreements, do not guess.
2. A human maintenance review must approve the source-backed civil start/end
   dates. The schema checks evidence fields; it cannot prove sources are accurate.
3. Put records in `docs/assets/festivals/YEAR.json`, listing that year in
   `index.json`. Required reviewed fields: unique `id`, `name`, `theme` (one of
   the approved presentation presets), `status: reviewed`, `start`, `end`,
   `regions`, `tradition`, integer `priority` 0–100, `reviewer`, `reviewedOn`,
   and nonempty `sources` with HTTPS `url` and descriptive `label`.
4. A start date belongs to its file's year. An inclusive end may cross the year
   boundary, at most 366 days later. Civil dates must be real Gregorian dates.
   IDs must also be unique across adjacent-year registries.
5. Unreviewed records never activate. Malformed reviewed metadata fails closed
   to the original theme. Never enter a test fixture or example URL as evidence.
6. Run the validator/tests and review rendered banners before approval. Update
   the initial empty-registry guard test only together with a real evidence review.

Eligibility starts seven **calendar days** before `start` and ends after `end`
in Asia/Kolkata. Bundled adjacent-year files cover December/January boundaries.
The active region is explicit; IN means All-India scope only, not every regional
tradition. No device location is requested and the canonical city is not changed.

Overlaps sort deterministically: exact selected-region relevance, descending
reviewed priority, ascending start date, ID. Other eligible observances remain
linked; no legitimate overlap is silently removed. No event is selected while
the reviewed schedule is empty, unavailable or invalid.

## Preferences and lifecycle

`hdc-festival-preferences-v1` stores only mode, selected presentation region and
effects. Existing location, favourites and Japa stores remain untouched. Original
theme always overrides automatic presentation. Corrupt/blocked storage fails
safely, with a session-only explanation on failed saves. Storage events sync tabs.
Refresh is scheduled at the next India midnight, not continuous polling; Material
navigation/pageshow reinitializes, aborts stale requests and clears old timers.
Only successful manifest/year reads are cached in memory; no external API is used.

## Release gate and verification

All presentation UI, script/style activation and offline shell entries are gated
by `HDC_PRACTICE_PREVIEW=1`. Default production remains disabled. Do not enable
deployment until the complete coordinated release is approved.

Tests: `node scripts/test_festival_themes.mjs` and
`node scripts/test_festival_browser.mjs` (after a preview strict build).
Fixtures use deliberately fictional dates and `example.invalid`; none are in
production registries. Cover seven-day boundaries, India midnight, overlaps,
regional scope, leap/year transitions, bad evidence, preference persistence,
manual preview, fallback and expiry. Screenshots: `work/festival-preview`.

Full automatic festival deployment remains incomplete until reviewed year/region
data and final owner-reviewed visual QA are available. This document must not be
read as certification of any real festival date.
