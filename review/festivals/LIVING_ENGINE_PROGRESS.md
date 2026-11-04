# Living Festival Experience V2 — work in progress

## Release status

NOT review-ready. NOT approved for merge or deployment. No production hook,
stylesheet, preference, catalogue, Panchang, PDF, icon or existing date record
has changed. The new scheduling module is unimported and has no runtime cost.
This is an initial implementation checkpoint, not fulfillment of the master prompt.

## Gate 1 findings

Architecture: MkDocs Material, shared `theme/main.html`, `hooks/generate.py`,
instant navigation and versioned PWA shell. Existing `abp-festivals.js` owns
preview preferences/lifecycle and dynamically imports `assets/festivals/themes.mjs`.
Its CSS only changes a scoped panel; it is not full immersion. Region choices
are only IN/UP/MH/DL. 2026 is empty; 2027 has one prior owner-reviewed reference
civil day. The existing sort is regional-first rather than active-celebration-first.
Keep its old preference schema/data intact during a future reviewed migration.

Baseline recorded before edits using the existing finite CDP lab: cold contexts,
4× CPU, 150ms latency, 1.6Mbps download, gzip, worker/cache disabled, fonts loaded.
No field CWV, physical-device or full INP certification is claimed.

| Page / width | LCP ms | Lab interaction candidate ms | CLS |
| --- | ---: | ---: | ---: |
| Home / 375 | 4148 | 160 | 0.00461 |
| Find / 375 | 2284 | 24 | 0.02371 |
| Home / 1440 | 2420 | 208 | 0.00304 |
| Find / 1440 | 1644 | 24 | 0.00241 |

The original baseline fails some lab targets. Preserve full raw report and
request failures; never report this as passing field CWV. Candidate comparisons
must repeat the exact transport, fixtures and task paths. Initial proposed
enhancement budget: no new layout-shift sources; no third-party requests;
deferred script ≤15 KiB gzip; theme CSS ≤12 KiB gzip; one optional ≤100 KiB
decorative image; no image requests under data-saver; at most 12 animated
decorative nodes; zero animation under reduced-motion/high-contrast. Proposed
budgets are not measured approvals. Physical device motion QA remains pending.

## Gate 2 — blocked from promotion, research incomplete

`living-coverage.json` inventories all 28 states / 8 UTs and the five requested
years. All 180 V2 region-year cells are explicitly gaps. Do not confuse a
complete list of jurisdictions with a completed festival coverage audit.
Source discovery began through government tourism/holiday calendars and IMD.
Holiday dates alone do not establish religious family durations. The IMD page
itself contains apparent date/weekday inconsistencies; reconciliation is
required. No newly researched event has been promoted to verified status.

Run `node scripts/audit_living_festival_coverage.mjs` for the human-readable
matrix; `--require-ready` must fail until reviewed coverage exists. This audit
does not manufacture or automatically publish annual updates.

## Gate 3 — independent scheduler core started

`living-scheduler.mjs` separates explicit verified family windows from member-day
variations. It implements IST civil days, -7…-4 anticipation, -3…-1 approach,
inclusive celebration, active-before-approaching precedence, nationwide default,
regional tie-breaking, priorities/stable IDs, owner/admin opt-out, timed reviewed
overrides and explainable selection. Individual invalid records are skipped;
ambiguous duplicate window IDs fail closed. Tests use fictional dates and
`example.invalid`, never publication data. These tests do not certify dates.

Lifecycle wiring, schema hardening, migration and integration remain pending.
Old engine behavior is unchanged until the new system is complete and approved.

## Remaining mandatory gates

- Complete state-wise research, aliases/traditions/localization and year evidence.
- Five distinct six-layer art directions, approved asset inventory and screenshots.
- Full-site reversible CSS layer, preferences and adaptive-quality implementation.
- PWA schedule/cache integration, instant-navigation lifecycle and midnight/resume tests.
- Original/three-stage/restored screenshots, keyboard/contrast/a11y and missing-asset QA.
- Matched before/after performance experiments and complete regression validation.
- One consolidated review-ready PR only when gates pass; until then any PR is draft.

Rollback today: do not import the new module. Future release must have an
independent administrator kill switch plus visitor Original mode which removes
all festival attributes/decorations. No public admin or remote date API is planned.
