# Living Festival Experience V2 — implementation checkpoint

Updated 2026-11-05. **Incomplete; not ready for merge or deployment.**
The catalogue, PDFs, Panchang calculations, approved images and deployment are intact.

## Gate status

| Gate | Current evidence | Remaining work |
| --- | --- | --- |
| Audit | MkDocs Material, existing V1, worker/preferences inspected; pre-change lab baseline | Final preservation diff |
| Data | 36 jurisdiction worklists; 164 discovery candidates; 31 source-checked periods / 158 member days, 2026–2030 | All 36 initial source leads revisited with actual retrieval outcomes; completeness audits remain open; 159/180 region-year cells lack a period; more traditions/temple sources |
| Scheduler | IST midnight, three stages, inclusive families, variants, active-first overlaps, regions, overrides and fail-closed tests | Expanded real-calendar reconciliation |
| Prototypes | Five initial CSS/SVG studies plus Ganesha, Navratri, Durga Puja and Ratha Jatra extensions, phone/desktop screenshots and three lighting intensities | Cultural/owner review, richer visual directions; not final approved art |
| Expansion | Seven scoped festival families; 2026–2030 for six, 2026 only for Puri Ratha Jatra | Remaining families, regional directions and assets |
| Integration | Independent build flag, local preferences, V1 read-through, instant navigation, midnight/resume, adaptive effects, offline worker | Translation review; final release remains gated |
| Validation | Current strict preview build, smoke, scheduler, registry, browser and targeted accessibility pass | Matched performance acceptance, physical-device/AT checks, final regressions |
| Reconciliation | Release OFF, annual audit and rollback documented | Resolve outstanding gates; one consolidated PR, draft until complete |

## Sources and release boundary

The owner accepted source-checked, clearly labelled published calendar references
for the specified city/tradition on 2026-11-05. This is a verification standard,
not merge/deploy permission or a universal religious ruling.

The 31 periods cover Diwali, Chhath and Shardiya Navratri for New Delhi, Pongal
for Chennai, Ganeshotsav for Mumbai and Durga Puja for Kolkata in 2026–2030,
plus the official Odisha Tourism 2026 Puri Ratha Jatra reference. Explicit year/place URLs, publication title/hash,
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

- Strict V2 preview build passed 2026-11-05 (123.44 seconds; uv run mkdocs build --strict).
- Smoke passed: 16 routes, 43,085 canonical IDs, Panchang, favourites and PWA.
- Pure scheduler and source-registry consistency checks pass.
- Expanded browser run passed 2026-11-05 at 320/360/390/414/768/1024/1440px:
  three timezones, exact IST boundaries, three stages, family variants, saved V1
  choices without rewriting V1, instant navigation/Back, quota failure, kill
  switch, unavailable registry, real service worker and actual offline reference
  Diwali/Chhath handover. Only an isolated test-server policy enables dates.
- Original/restored viewport PNGs match byte-for-byte at 320/1440 in the fixed-clock,
  reduced-motion lab. This is bounded evidence, not every-device certification.
- Targeted accessibility passed 54 light/dark phone/tablet/desktop samples (latest expanded run; raw report records the tested themes): native
  labels, keyboard focus/restore, 44px targets, containment, hidden decorative SVGs,
  and measured text contrast >=6.49:1. Not full WCAG or physical AT certification.
- Panchang (16/16 groups), source registry, V1 festival and site smoke checks
  passed again after the current 31-period build. The sacred-site run completed
  all layout assertions: 2353 HTML pages, 42 categories at 320/1440px, 28 routes
  across phone/tablet/desktop and light/dark; its session expired before the
  process-exit result could be retrieved, so only the completed assertions are claimed.
- Ephemeris, universal/browser search and navigation suites passed earlier on
  this branch; later changes do not alter those algorithms or navigation.

Current browser/accessibility reports are committed in evidence/ and representative
screenshots in screenshots/. Full stage screenshots remain in work/living-festival;
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
performance and final regressions. Yearly audit emits gaps, candidate-specific inventory follow-ups and null-date research
tasks, never automatic calendar changes. See MAINTENANCE.md. Keep one feature
branch and incremental commits; do not enable release or deploy unfinished gates.

## Additional reconciliation on 2026-11-05

All 36 initial source leads now have explicit direct-body/PDF or fetch-failure
records in DIRECT_SOURCE_AUDIT.md. This remains incomplete coverage, not a
certification that all major festivals have been found. Four selected published
calendar formats have a read-only yearly proposal helper; its eight offline
safeguard tests pass. Twenty 2026–2030 Onam/Holi/Shivaratri/Janmashtami source
proposals are retained as UNAPPROVED, outside runtime data. Overnight endpoints,
tradition differences and appropriate presentation still require actual review.

Expanded browser assertions pass with no ordinary console errors: explicit
pageshow/visibility restoration after clock jumps, repeated bfcache cleanup,
cross-tab preference synchronization and missing-module fallback. Virtual clock
leaps run on shared content pages so they do not artificially expire the separate
astronomy-worker watchdog before that real worker can respond. No Panchang code
was modified.

The fixed-Date performance fixture proved unsuitable for Material/RxJS focus
scheduling. Its failed reports are preserved, not accepted as feature scores.
Version 3 keeps the native advancing clock and places only a synthetic celebration
window around the current IST day. In the first matched pair all real tasks pass
with no failed requests: Original LCP 2052/1472/1896/1108ms and celebration
2380/1580/2568/1420ms (375 Home/Find, then 1440 Home/Find). Original passes all
finite targets; celebration exceeds 2500ms on desktop Home. CLS stays below .021
in both. This single pair is NOT performance acceptance; repeated paired samples
and LCP element/resource attribution are the next checks. No search algorithm,
index, imagery or production UI was changed to improve scores.
