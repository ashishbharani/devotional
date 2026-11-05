# Living Festival Experience V2 — implementation checkpoint

Updated 2026-11-05. **Incomplete; not ready for merge or deployment.**
The catalogue, PDFs, Panchang calculations, approved images and deployment are intact.

## Gate status

| Gate | Current evidence | Remaining work |
| --- | --- | --- |
| Audit | MkDocs Material, existing V1, worker/preferences inspected; pre-change lab baseline | Final preservation diff |
| Data | 36 jurisdiction worklists; 151 discovery candidates; 15 source-checked periods / 65 member days, 2026–2030 | All 36 completeness audits open; 170/180 region-year cells lack a period; more traditions/temple sources |
| Scheduler | IST midnight, three stages, inclusive families, variants, active-first overlaps, regions, overrides and fail-closed tests | Expanded real-calendar reconciliation |
| Prototypes | Five differentiated CSS/SVG studies plus Ganesha continuity study, phone/desktop screenshots and three lighting intensities | Cultural/owner review, richer visual directions; not final approved art |
| Expansion | Diwali/Chhath/Pongal reference calendars | Remaining families, regional directions and assets |
| Integration | Independent build flag, local preferences, V1 read-through, instant navigation, midnight/resume, adaptive effects, offline worker | Translation review; final release remains gated |
| Validation | Current strict preview build, smoke, scheduler, registry, browser and targeted accessibility pass | Matched performance acceptance, physical-device/AT checks, final regressions |
| Reconciliation | Release OFF, annual audit and rollback documented | Resolve outstanding gates; one consolidated PR, draft until complete |

## Sources and release boundary

The owner accepted source-checked, clearly labelled published calendar references
for the specified city/tradition on 2026-11-05. This is a verification standard,
not merge/deploy permission or a universal religious ruling.

The 15 periods currently cover Diwali and Chhath for New Delhi and Pongal for
Chennai, each year 2026–2030. Explicit year/place URLs, publication title/hash,
review date, scope and confidence are recorded. Dates live only in the canonical
activation registry; review records reference its IDs. No Gregorian annual shifts
or automatic promotion from calculated Panchang rules are used. Tourism/holiday
calendars with incomplete, tentative or conflicting periods remain unapproved.
V1's existing 2027 Shiva civil-day record remains unchanged; it does not establish
an overnight period. Record counts never certify comprehensive coverage.

Normal builds retain V1. V2 replaces it only with both HDC_PRACTICE_PREVIEW=1 and
HDC_LIVING_FESTIVAL_PREVIEW=1. living-policy.json is disabled; deploy.yml has no V2
enablement. No public admin or runtime date-override URL exists.

## Current verification

- Strict V2 preview build passed 2026-11-05 (113.38 seconds).
- Smoke passed: 16 routes, 43,085 canonical IDs, Panchang, favourites and PWA.
- Pure scheduler and source-registry consistency checks pass.
- Expanded browser run passed 2026-11-05 at 320/360/390/414/768/1024/1440px:
  three timezones, exact IST boundaries, three stages, family variants, saved V1
  choices without rewriting V1, instant navigation/Back, quota failure, kill
  switch, unavailable registry, real service worker and actual offline reference
  Diwali/Chhath handover. Only an isolated test-server policy enables dates.
- Original/restored viewport PNGs match byte-for-byte at 320/1440 in the fixed-clock,
  reduced-motion lab. This is bounded evidence, not every-device certification.
- Targeted accessibility passed 30 light/dark phone/tablet/desktop samples: native
  labels, keyboard focus/restore, 44px targets, containment, hidden decorative SVGs,
  and measured text contrast >=6.49:1. Not full WCAG or physical AT certification.
- Panchang, ephemeris, universal/browser search, navigation, sacred-site and V1
  festival suites passed earlier on this branch. Final reconciliation must
  distinguish their tested revision from later changes.

Raw current browser/accessibility reports and screenshots are in work/living-festival;
preview CI uploads them. Fixtures do not certify dates or cultural approval.
V1 Auto/Original/Ganesha/Shiva, region and effects are read without writes. New
choices use V2 storage; unsupported records stay untouched. Region never writes
Panchang location. The administrator kill switch suppresses saved previews too.

## Performance acceptance remains open

Cold CDP lab: 4x CPU, 150ms latency, 1.6Mbps download, gzip, real fonts, cache/worker
disabled. baseline.json predates edits. No field CWV or physical-device INP claim.

| Run | 375 Home LCP / CLS | 375 Find LCP / CLS | 1440 Home LCP / CLS | 1440 Find LCP / CLS |
| --- | --- | --- | --- | --- |
| Pre-change baseline | 4148ms / .00461 | 2284ms / .02373 | 2420ms / .00299 | 1644ms / .00240 |
| Initial V2 celebration | 1788ms / .00390 | 1280ms / .18372 | 1804ms / .00201 | 1140ms / .27876 |
| V2 Original control | 1736ms / .00390 | 1672ms / .18372 | 2356ms / .00280 | 1128ms / .27876 |
| Fresh legacy control | 9496ms / .00273 | 1620ms / .22823 | 2716ms / .00284 | 1392ms / .30881 |

These noisy single runs do not pass acceptance. Find result insertion shows large
delayed shifts in Original and legacy controls too; this does not demonstrate an
atmosphere-induced shift. The legacy run saved its complete report but old system
Node shutdown was interrupted; do not call that command a passing process. Bundled
Node 24 avoids the installed runtime issue. Search was not changed for scores.

Budgets: combined enhancement JS <=15KiB gzip, CSS <=12KiB, no new image requests,
at most 12 animated decorative nodes, zero motion with reduced motion/high contrast.
Current browser checks enforce byte/adaptive limits. Repeat matched measurements
and resolve variability before acceptance.

## Resume and rollback

Continue source/state research, remaining family art, visual review, localization,
performance and final regressions. Yearly audit emits gaps and null-date research
tasks, never automatic calendar changes. See MAINTENANCE.md. Keep one feature
branch and incremental commits; do not enable release or deploy unfinished gates.
