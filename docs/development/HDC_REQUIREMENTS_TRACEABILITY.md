---
title: HDC Requirements Traceability
---

# HDC requirements traceability

Audit date: **3 November 2026 (Asia/Calcutta)**. Audited code: `00e45029ed53fcc4c6ddd0776020c2a51cd86edb`; latest production branch: `2153bec47fae545c72a581ff503a133d3db161d9` (PR 56); integration incorporates main only through `7e88e7a`.

[Owner dashboard](HDC_MASTER_COMPLETION_DASHBOARD.md) · [Finite remaining plan](HDC_REMAINING_INCREMENT_PLAN.md)

> **Coverage-count boundary:** language counts are the pre-audit `00e4502` generated-site snapshot. These maintenance documents add English hosted text under the existing MkDocs build; refresh coverage for the final documentation/source snapshot. The code-fenced original is documentary source, not a new instruction or authored translation. No audit exclusion was added to improve coverage numbers.

## How to read this matrix

**149 normalized original requirements:** 72 COMPLETE, 64 PARTIAL, 4 NOT STARTED, 9 BLOCKED. Repeated guardrails and overlapping bullets are consolidated into traceable acceptance units; a row can list several tightly related bullets explicitly. These units have unequal size and overlap at outcome level. **They are an inventory, not weighted product points or a defensible completion percentage.** The source-coverage ledger below maps all 20 original sections. The recovered1007-line original prompt is reproduced as a numbered source appendix so future reviewers need not rely on a disappearing attachment.

COMPLETE means the bounded criterion has direct source/execution evidence. It does not imply that the containing workstream, final release, real device/account behavior or owner approval is complete. PARTIAL means some implementation/evidence exists but the stated acceptance is not met. NOT STARTED means no deliverable for that specific criterion was found. BLOCKED identifies content/decision/release dependencies preventing acceptance; code may already exist. No negative runtime finding was fixed during this audit.

Implementation, test, approval and deployment are separate in the dashboard ledger. Every new PR 51 interface remains **preview-only and unapproved for the final launch** unless a row explicitly identifies already-public baseline behavior. Evidence may be source inspection, exact-head CI, qualified historical local execution, or the new isolated audit probes; it is never silently interchangeable.

## Original source and interpretation boundaries

Source **M** is the owner-provided “HDC MASTER PROMPT — COMPLETE WEBSITE TRANSFORMATION,” recovered from attachment `8d246d2b-65fa-4dc7-be61-cff5d93f2aeb/Pasted text.txt`. It has 1007 lines; SHA256 `ff80cf0f0db501e3d12dd86d110813f6987c082cd4b0f29ba0b6a53f8fab8c70`. The original prompt is accessible: this is not an audit reconstructed only from the11-stage tracker.

- M369/379 explicitly permits a **useful verified Reader pilot**. A complete scripture corpus or all 43,085 first-party texts is not an original mandatory requirement. Verified transliteration and actual extensibility remain gaps in that pilot.
- M259-263 explicitly permits **neutral Daily discovery** when no justified recommendation exists. A new deity-of-the-day dataset is not mandatory.
- M309/375 recordings and M614 analytics are **conditional**. Honest silent/no-tracking fallbacks satisfy those constraints until rights/authorization exist.
- M489 says **evaluate** five mobile destinations; it does not authorize replacing the approved six without evaluation. M401 says festival themes **may** alter listed surfaces; not every possible effect is mandatory.
- M681 requires field data **where available**, not invented certification. Realistic load/input evidence is still missing; local LCP/CLS is not field data or INP.
- “Custom prayer routine,” “important landing pages,” supported festival/region coverage and “useful pilot” need bounded acceptance choices. The roadmap proposes finite deliverables and records these decisions; it does not invent a corpus, article quota, every-festival promise or advanced ritual automation.
- Whole-hosted-text translation is a separately adopted owner request documented in PR 54 and the earlier language conversation. It remains a current release dependency, but is not counted as 149 original-M rows. Source-preservation/language-continuity clauses of M are still mapped below.

## Evidence register

Links are pinned to the audited codehead; later audit-document commits do not inherit a new full runtime pass merely by being descendants. Local `work/` paths are ignored artifacts available in the owner workspace. CI artifacts may expire; archive a final release dossier when R9 closes.

### EV-GIT

**Snapshot and branch evidence.** Fetched origin on 3 November 2026. Code/integration head 00e4502 incorporates main through 7e88e7a. Final refresh found latest main 2153bec from merged/deployed PR 56; its 21-file language/cache changes are not integrated here. The current PR is reported unmergeable; no merge was attempted during this audit. At the audited code snapshot PR 51 was open, draft and unmerged with 70 changed files (+3651/-36). The new audit-only Markdown files are additional, not feature implementation. PR 49/50 were merged upstream despite their draft release restrictions. This audit neither merged them nor authorizes reversing production. Only documentation is changed here.

Source: [AGENTS.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/AGENTS.md), [mkdocs.yml](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/mkdocs.yml), [.github/workflows/deploy.yml](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/.github/workflows/deploy.yml).

### EV-PRES

**Protected source comparison.** git diff --name-only 4bcd18c HEAD over canonical source, search registry, astronomy/adapters/time-conversion, provider/rules, approved hero and brand-source fingerprint returned no changes. Collection SHA2561566 bba 3 c 5156 fb 2 aa 046 b 03080187 cad 70 d 745 ade 752 f 89 aa 601 dcf 4 d 80 fd 8 d;43,085 works,42 real categories. PR 51 has no artwork/PDF changes against main. PR 55 separately replaces native information pages and withholds Contribution; do not undo that authorized upstream exception. The external authoritative PDF is not independently byte-hashed by this audit; no PDF-generation/source change is in this branch.

Source: [data/collection.json](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/data/collection.json), [data/corrections.csv](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/data/corrections.csv), [data/additions.csv](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/data/additions.csv), [docs/assets/panchang/astronomy.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/assets/panchang/astronomy.mjs), [docs/assets/ephemeris/ephemeris-engine.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/assets/ephemeris/ephemeris-engine.mjs), [docs/javascripts/abp-firebase-config.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-firebase-config.js), [firestore.rules](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/firestore.rules).

### EV-BASE

**Baseline inventory and capture.** work/transformation/baseline/report.json and five screenshots exist.320/375/768/1024/1440 snapshots report 200, no horizontal overflow/no page exceptions. The initial inventory records routes/bookmarks/internal/external destinations; these are dated baseline evidence, not a current whole-site or device certification.

Source: [scripts/capture_transformation_baseline.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/capture_transformation_baseline.mjs), [docs/development/HDC_TRANSFORMATION_PROGRESS.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/development/HDC_TRANSFORMATION_PROGRESS.md).

### EV-HOME

**Daily Darshan and real entry paths.** daily_darshan() embeds the single authoritative Panchang summary and six real guided destinations. Neutral deity/work recommendation is expressly allowed by M259-263. Japa resume reads only numeric existing state; preview Reader continuation checks strict boolean flags. Ten width/theme cases exist. Live HTTP confirmed Daily Darshan present and Reader resume absent; new resume code is gated.

Source: [hooks/royal_home.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/hooks/royal_home.py), [docs/javascripts/abp-daily.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-daily.js), [scripts/test_daily_darshan_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_daily_darshan_browser.mjs).

### EV-HEADER

**Approved navigation and viewport recovery.** PR 52 approved-board refinements and PR 53 icon fix are retained. Current code reuses Material search toggle beside header and bounds mobile backdrop. Tests cover responsive geometry, keyboard-sized viewports, theme controls and real destinations; resizing is not physical Android/iOS IME observation.

Source: [docs/javascripts/navigation.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/navigation.js), [docs/stylesheets/hdc-header.css](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/stylesheets/hdc-header.css), [scripts/test_header_fidelity_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_header_fidelity_browser.mjs), [scripts/test_mobile_keyboard_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_mobile_keyboard_browser.mjs).

### EV-DES

**Shared design and accessibility automation.** Shared palette/reading controls are reused. Design test covers 8 routes x 3 widths x 2 themes x 2 reading modes=96 cases with selected solid-surface contrast/focus/containment/reduced motion. Local design images last came from 832b27c (passed within a run that failed another test); current 00e CI independently generated exact-head design artifacts. Local Reader phone and festival tablet screenshots were visually inspected during this audit; tall/element captures can stitch fixed controls and are not proof of live overlap or complete visual acceptance.

Source: [docs/stylesheets/practice.css](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/stylesheets/practice.css), [docs/stylesheets/sacred-site.css](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/stylesheets/sacred-site.css), [scripts/test_design_system_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_design_system_browser.mjs), [scripts/test_sacred_site.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_sacred_site.mjs).

### EV-PRACTICE

**Sanctuary and Reader executable controls.** Sanctuary has diya, flowers, approved Ganesha, synthesized bell, independent quiet/effects, reflection,5/10/20 timers and authoritative Japa link. Sound starts OFF; no licensed ambient recording is bundled. AudioContext is stubbed in tests. Reader branch has one querySelector passage, scalar read/bookmark state, search/print/share/typography, not a multi-passage content model. Scoped listeners/timers/audio cleanup inspected.

Source: [docs/sanctuary.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/sanctuary.md), [docs/javascripts/abp-practice.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-practice.js), [scripts/test_practice_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_practice_browser.mjs).

### EV-READER

**Verified pilot source and content limitations.** One Sanskrit Bhagavad Gita 2.47 plus three Telang 1882 English sentences. Fixed Sanskrit revision 408369, IITKanpur cross-reference, English revision 15736168 and scanned-page hash are documented. Original sources/rights record and actual source text were inspected; no claim of critical-edition/native-language certification. Verified transliteration is explicitly unavailable. Original M369/379 permits a useful pilot, not a full-corpus delivery mandate.

Source: [docs/reader/index.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/reader/index.md), [docs/development/READER_PILOT_SOURCES.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/development/READER_PILOT_SOURCES.md).

### EV-FESTIVAL

**Festival engine versus real observances.** Engine validates India timing, reviewed scope, seven-day boundaries, priority and overlap. Bundled2026 events=[], manifest only 2026. Only unreviewed candidate is Maharashtra2026-09-14 (past at audit), outside public manifest; no real upcoming activation. Manual Ganesha/Shiva previews and four region choices are not comprehensive site-wide theming. Test dates/example.invalid evidence are deliberately synthetic. Existing maintenance policy requires real reviewer/date and finite regional/source scope before publication.

Source: [docs/assets/festivals/themes.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/assets/festivals/themes.mjs), [docs/assets/festivals/2026.json](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/assets/festivals/2026.json), [docs/javascripts/abp-festivals.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-festivals.js), [scripts/test_festival_themes.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_festival_themes.mjs), [scripts/test_festival_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_festival_browser.mjs), [review/festivals/2026-candidates.json](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/review/festivals/2026-candidates.json).

### EV-JOURNEY

**Dashboard, routine model and active-state protection.** Dashboard, journal, opt-in local notes, name/duration routines,50-entry self-report log, daily/rolling-week summaries and scoped erase exist. Active Journey key preserves valid unknown fields/rejects unsupported records after 00e fix. Routine library still maps rows to known fields, reconstructs its envelope and lacks library-specific visit-only external-change guard (AF1). There is no actual selected-prayer/work sequence builder.

Source: [docs/journeys.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/journeys.md), [docs/javascripts/abp-journeys.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-journeys.js), [scripts/test_routine_library_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_routine_library_browser.mjs), [scripts/test_journey_data_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_journey_data_browser.mjs).

### EV-JAPA

**Authoritative counter and optional history.** Preview numeric count/continuity epoch bridge does not change original persistent counter schema. Explicit Start/Finish records delta/timestamps, max 50, Undo/reset/navigation cancellation. Tests exercise real first-install offline recording. Combined write-failure/external-future/recovered-write sequence was not in prior regressions and is AF3.

Source: [docs/javascripts/abp-japa.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-japa.js), [docs/javascripts/abp-japa-history.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-japa-history.js), [scripts/test_japa_history_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_japa_history_browser.mjs).

### EV-SHORTCUT

**Verified section navigation.** Up to 10 actual relative routes; public registry 2244 generated sections is on demand, not global precache. Labels resolved from source, not stored prayer names. Guest IndexedDB favourites and pagination exercised. This is distinct from account work favourites and does not promise every unvisited route offline.

Source: [docs/javascripts/abp-section-shortcuts.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-section-shortcuts.js), [theme/partials/section-shortcut.html](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/theme/partials/section-shortcut.html), [scripts/test_section_shortcuts_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_section_shortcuts_browser.mjs).

### EV-DISCOVERY

**Supported discovery facets and absent pathways.** Explore currently has query/category/language/form, derived from canonical compact search. It restores supported URL values and links original finder/library/A-Z/deity directory. Region/tradition/festival are not structured reviewed facets; generic notes/links are not equivalent to fulfilling those pathways. Kuladevata is explicitly conditional on verified support. Five-destination evaluation record not found; preserving six approved destinations is not itself a defect.

Source: [docs/explore.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/explore.md), [docs/javascripts/abp-discovery.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-discovery.js), [scripts/test_journey_discovery_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_journey_discovery_browser.mjs).

### EV-SEARCH

**Existing canonical identity semantics.** Finder renders identity contexts, exact/alias/related forms and real filters; ranking/registry algorithms preserved. Search/Unicode/generated CWID checks pass in CI. A verified recommendation/card presentation inventory is still distinct from retaining existing canonical matching.

Source: [docs/javascripts/abp.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp.js), [scripts/test_universal_search.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_universal_search.mjs), [scripts/test_search_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_search_browser.mjs).

### EV-SEO

**Generated metadata, sharing and editorial template.** All-page head/canonical/social metadata, approved icon, breadcrumb hierarchy/private Journey exclusions and native/copy/manual sharing inspected. One maintenance template sits outside docs. No mandatory article quota follows from the six genre examples. Actual external indexing/social rendering or accepted important-work landing inventory is not established by markup tests.

Source: [theme/main.html](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/theme/main.html), [docs/javascripts/abp-sharing.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-sharing.js), [templates/editorial-article.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/templates/editorial-article.md), [scripts/test_social_metadata.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_social_metadata.py), [scripts/test_seo_structure.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_seo_structure.py).

### EV-REPO

**Public repository branding settings.** Read-only public GitHub REST metadata on 3 November 2026:description=null, topics=[], homepage=https://ashishbharani.github.io/devotional/. Therefore public description/topics work is NOT STARTED, not assumed complete from README changes. Owner-approved wording/settings are still needed.

Source: [README.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/README.md).

### EV-PWA

**Install and worker evidence.** Live manifest and sw 200. Native install/iOS/standalone state tests use synthetic events or UA/mode mocks in Chromium; actual-device support not established. Real service-worker install/offline/failure/update tests are substantive but old-version fixture is current strategy plus marker, not all historical workers. Default deploy build does not set preview flag; merging unchanged code would not activate hidden feature interfaces.

Source: [docs/javascripts/abp-pwa.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-pwa.js), [hooks/sw.template.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/hooks/sw.template.js), [scripts/test_approved_header_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_approved_header_browser.mjs), [scripts/test_pwa_upgrade_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_pwa_upgrade_browser.mjs), [scripts/test_pwa_release_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_pwa_release_browser.mjs), [.github/workflows/deploy.yml](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/.github/workflows/deploy.yml).

### EV-PERF

**Bounded local measurements.** Latest local performance.json on 00e:52,970 feature bytes and 3,102,683 helper bytes within 100 KiB/4 MiB budgets. LCP 344/288/336 ms at 375/768/1440; labCLS~.00222/.00133/.00127. Unthrottled localhost, font CSS stubbed,1 s observation, INP not measured. No field-success claim is supported. Older~1.97 shift is not a confirmed current defect. Available field data is conditional, not a new permanent certification requirement.

Source: [scripts/test_pwa_release_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_pwa_release_browser.mjs), [scripts/lab_metrics.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/lab_metrics.mjs), [docs/development/RELEASE_QA.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/development/RELEASE_QA.md).

### EV-LANG

**Language boundaries and separate adopted scope.** Main PR 54 removed Google and installed local phrase/key translation. 140 registered keys and63 phrases do not establish whole-site translation. Snapshot audit:2281 pages,13,696 candidate records;unknown proper names/fragments require classification before treating all as prose. Review export creates blank unreviewed targets only. The integration implicit translator respects translate=no/notranslate; carry that protection through the pending latest-main merge. See EV-UPSTREAM56 for the deployed partial Hindi checkpoint. Runtime message variants/quality need separate review.

Source: [docs/javascripts/abp-i18n.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-i18n.js), [docs/assets/i18n.json](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/assets/i18n.json), [scripts/audit_hosted_translations.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/audit_hosted_translations.py), [scripts/export_translation_review.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/export_translation_review.py), [scripts/test_translation_browser.mjs](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/test_translation_browser.mjs).

### EV-QA

**Exact-head tests, historical evidence and reviews.** Codehead 00e CI run 41460309378 SUCCESS; all configured workflow steps completed with no failure. Local full 45/45 belongs 566b5f9 and recorded3 untracked export files;8/8 selected1d3bcd7;13/14 selected832b27c with Journey failure;7/7 selected00e. Current runner 47, not a local full 47 claim. Current CI artifacts are available at the Actions run; local images are not automatically reattributed. No APPROVED review; four COMMENTED review submissions. One outdated unresolved thread addresses old active-Journey memory behavior; code/test correction exists, thread not administratively resolved. Last automated no-major-issue review was a246272, not 00e.

Source: [scripts/run_release_validation.py](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/scripts/run_release_validation.py), [.github/workflows/check.yml](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/.github/workflows/check.yml), [docs/development/RELEASE_QA.md](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/development/RELEASE_QA.md).

### EV-LIVE

**Read-only live deployment checks.** 3 November 2026 HTTP probe:homepage200 and Daily Darshan present;no practice/journey script or Reader-resume marker. sanctuary/, reader/, journeys/, explore/ all 404. manifest.webmanifest and sw.js 200;worker lacks Sanctuary shell. This establishes observed public-vs-hidden state, not a complete production/device/account test. Browser/web text tool failed; separate direct HTTP probe succeeded. Detailed raw probe is local work/completion-audit/live-check.json.

### EV-UPSTREAM56

**Final upstream/production refresh.** [PR 56](https://github.com/ashishbharani/devotional/pull/56) merged as `2153bec47fae545c72a581ff503a133d3db161d9`. Deployment [41511897673](https://github.com/ashishbharani/devotional/actions/runs/41511897673) build/deploy jobs succeeded. Independently read Git blobs: Hindi has **482 registered source units**; other eight full-text packs each have **0 units**. These drafts target partly superseded publication text; current-page missing prose and native meaning review remain open. Live Hindi pack and i18n runtime bytes matched main exactly; gated routes and withheld Contribution/QR remain 404. This is a deployed partial translation checkpoint, not full translation completion.

Integration code `00e4502` does not contain that loader/pack/cache change. Its older CI success cannot validate a combined candidate with latest main. The PR API still reports7e88e7a as base object while refreshed origin/main is2153bec; it reports mergeable=false. R1 begins future development by reconciling this baseline, preserving PR51 translate=no/notranslate source/private exclusions plus PR 56 lazy loading/offline/publication safeguards. R9 must refresh full integration evidence. No runtime merge or repair occurred in this audit.

Latest-main source: [translation status](https://github.com/ashishbharani/devotional/blob/2153bec47fae545c72a581ff503a133d3db161d9/TRANSLATION_REWORK.md), [Hindi pack](https://github.com/ashishbharani/devotional/blob/2153bec47fae545c72a581ff503a133d3db161d9/docs/assets/translations/hi.json), [runtime](https://github.com/ashishbharani/devotional/blob/2153bec47fae545c72a581ff503a133d3db161d9/docs/javascripts/abp-i18n.js). Full root probe: `work/completion-audit/upstream56.json`. No single new combined backlog count is asserted:13,696 belongs to the pre-audit integration artifact, not latest main plus PR51.

### EV-AF

**Independent isolated data-risk probes.** Audit-only Playwright probe on frozen 00e artifact used fresh localhost 4355 profiles and synthetic data, not live/user storage. AF1:valid routine envelope/row unknown fields lost; blocked write plus external schema 2 then write recovery overwrote future library. AF2:Reader bookmark action overwrote schema 2/unknown record. AF3:Japa-history blocked finish plus external schema 2 then recovery overwrote future history. All were observed true in work/completion-audit/data-risk-probes.json. Application source unchanged; these are findings for R1, not fixes performed during the audit.

Source: [docs/javascripts/abp-journeys.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-journeys.js), [docs/javascripts/abp-practice.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-practice.js), [docs/javascripts/abp-japa-history.js](https://github.com/ashishbharani/devotional/blob/00e45029ed53fcc4c6ddd0776020c2a51cd86edb/docs/javascripts/abp-japa-history.js).

Current exact-codehead CI: [run 41460309378](https://github.com/ashishbharani/devotional/actions/runs/41460309378). Review finding: [old memory-state thread](https://github.com/ashishbharani/devotional/pull/51#discussion_r4436432629). Included-base snapshot diff: [7e88e7a to audited head](https://github.com/ashishbharani/devotional/compare/7e88e7ad61bb8ef5486f900ad970a2ffc3134473...00e45029ed53fcc4c6ddd0776020c2a51cd86edb).

## Requirement matrix

### Execution and release governance

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="gov-01"></a>**GOV-01** | Upgrade the existing site into the ten named devotional-platform outcomes ([M:14-31](#source-m)) | An integrated upgrade rather than a replacement | Multiple working components; incomplete Reader/discovery/festival/quality outcomes | PARTIAL | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | Complete remaining deliverables, not just commit counts | All original acceptance groups satisfied with bounded source scope | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-02"></a>**GOV-02** | Inspect, implement coherent increments, test, fix, commit and record; safe concurrent work and recovery ([M:37-60;834-865](#source-m)) | Reproducible incremental execution and persistent checkpoints | Dedicated branch, tests and durable records exist; repeated micro-increments obscured completion | PARTIAL | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | Use the finite roadmap and substantial completion packages | Each package closes its stated acceptance criteria with exact-head evidence | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-03"></a>**GOV-03** | Use honest fallbacks for optional unavailable assets, credentials or permissions ([M:60](#source-m)) | Disclosed conditional capability instead of fabricated functionality | No unlicensed recordings or fabricated providers; explicit fallbacks | COMPLETE | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | None for fallback constraint | Unavailable optional capability stays labelled and does not pretend to function | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Integration process; no final approval; no final transformation approval |
| <a id="gov-04"></a>**GOV-04** | Use integration branch, default-OFF features and no partial public releases ([M:62-74;933-955](#source-m)) | One coordinated launch with protected production | PR 51 remains draft/gated; PR 49/50 were nevertheless merged externally | PARTIAL | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | Acknowledge historical exception and prevent further partial launches | No further partial merge; final explicit enablement only after approval | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-05"></a>**GOV-05** | Integrate, full-regress, visually compare and present final release candidate ([M:76-88;1003-1007](#source-m)) | A frozen, complete candidate and comprehensive PR | CI green on 00e; product/content/manual gates incomplete | BLOCKED | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | Finish R1-R8 and freeze a complete candidate | Exact final candidate passes all required checks and comparisons | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-06"></a>**GOV-06** | Explicit owner approval before one launch; verify live deployment before success claim ([M:83-88;933-977](#source-m)) | Approved launch and live verification record | No final transformation approval or launch exists | BLOCKED | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | Owner staging acceptance then separately authorized launch | Approval references exact artifact; live paths/workers/controls verified | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-07"></a>**GOV-07** | Maintain honest status, files, commits, tests, images, limits, dependencies and integration record ([M:869-901](#source-m)) | An owner-readable persistent record | Progress logs exist but mixed old statuses and stage counts caused ambiguity | PARTIAL | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | This master audit must replace percentage inference and define finite scope | Dashboard, traceability and roadmap agree and remain source-linked | R9; prerequisites and external review in the linked roadmap package. | Integration process; no final approval; no final transformation approval |
| <a id="gov-08"></a>**GOV-08** | Do not claim completion or automatically resume a different scope when mandatory work remains ([M:927-929;959-1007](#source-m)) | Truthful reporting and preserved unfinished state | PR is draft; unsupported source/assets explicitly limited; audit-only instruction respected | COMPLETE | [EV-GIT](#ev-git); [EV-QA](#ev-qa) | None for present reporting constraint | No full-release claim; no feature code changed during this audit | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Integration process; no final approval; no final transformation approval |

### Preservation and compatibility

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="pre-01"></a>**PRE-01** | Preserve canonical categories, sections, works, CWIDs, data model and authoritative PDF ([M:94-116;945-953](#source-m)) | Unchanged canonical source and identifiers | Protected data and engine paths have empty diff from 4bcd18c;43,085 works and42 actual categories retained | COMPLETE | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | None for inspected source preservation | Hashes/diffs unchanged; generated IDs/routes validate; never invent a43rd category | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-02"></a>**PRE-02** | Preserve working routes, PDF and library resources ([M:96;106;112](#source-m)) | Existing bookmarks and external-reading handoffs | Route/link checks pass; owner-controlled PR 55 deliberately withholds Contribution | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Document permitted upstream exception and verify final routing | All unexcepted baseline URLs/bookmarks work; Contribution remains restricted | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-03"></a>**PRE-03** | Preserve approved palette, brand, deity images, hero and PWA artwork ([M:97-98;110;947](#source-m)) | Approved identity without asset substitution | Protected hero/brand source unchanged; reviewed upstream PR 52/53 retained | COMPLETE | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | None for source identity constraint | Approved assets retain identity, aspect and documented provenance | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-04"></a>**PRE-04** | Preserve search identity/ranking, Panchang/calendar/converter/Ephemeris algorithms ([M:101-103](#source-m)) | Reliable existing discovery and astronomy | No protected engine/registry changes; calculation and search suites pass | COMPLETE | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | None for source/automated regression scope | Golden fixtures and canonical identity tests remain passing | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-05"></a>**PRE-05** | Preserve Japa counts, favourites, personal records and preferences ([M:104-105;949](#source-m)) | No destructive saved-data transition | Legacy Japa and guest favourites covered; new-library/Reader/history recovery gaps found | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live); [EV-AF](#ev-af) | Close AF1-AF3 through one seven-store compatibility matrix | Malformed/future/unknown data and blocked-write/cross-tab sequences preserve every store | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-06"></a>**PRE-06** | Preserve optional sign-in, provider settings, privacy and credential safety ([M:105;475;818-820](#source-m)) | Existing account boundaries; no journal exposure | Provider config/Firestore unchanged; private notes local and noindex; real authorized account session untested | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Verify existing account flows with an authorized test account if available | No credentials exposed, no new provider, no unintended private synchronization | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-07"></a>**PRE-07** | Preserve accessibility preferences and high-contrast behavior ([M:107;685-702](#source-m)) | Existing assistive controls remain usable | Chromium keyboard/contrast/enlargement tests exist; actual screen-reader/zoom review missing | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Complete supported-browser accessibility review | Core paths work with keyboard, screen reader, zoom and reduced motion | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-08"></a>**PRE-08** | Preserve native navigation, install controls, Pages paths and offline support ([M:108-109](#source-m)) | Existing application behavior survives upgrade | Header and real-worker tests pass; device install/standalone support is simulated | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Run actual supported-device/engine checks | Install/navigation/offline/update behavior observed on agreed real platforms | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-09"></a>**PRE-09** | No frozen PDF/database edits for web objectives; future source compatibility ([M:114-116;812](#source-m)) | Presentation-only extension | No canonical collection/PDF manipulation; overlays separate from source | COMPLETE | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | None for inspected source constraint | No data rewrite/CWID migration or generated-site-as-source edits | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Production baseline plus gated extensions; no final transformation approval |
| <a id="pre-10"></a>**PRE-10** | Do not remove approved functionality or silently break contracts ([M:112;945;953](#source-m)) | Explicit exceptions and compatibility review | Contribution exception documented; unresolved new-store compatibility findings | PARTIAL | [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Close R1 and final regression inventory | Approved baseline preserved; any exception has explicit owner provenance | R1/R7/R9; prerequisites and external review in the linked roadmap package. | Production baseline plus gated extensions; no final transformation approval |

### Baseline audit

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="base-01"></a>**BASE-01** | Inspect actual MkDocs hooks/templates/scripts/data/workflows rather than assume architecture ([M:122-139](#source-m)) | Architecture map | Architecture inventory and actual code paths verified | COMPLETE | [EV-BASE](#ev-base); [EV-PRES](#ev-pres) | None for baseline snapshot | Document names source-of-truth generator, themes, scripts, gates and workflows | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Recorded baseline, not release approval; no final transformation approval |
| <a id="base-02"></a>**BASE-02** | Inventory functionality, routes, canonical URLs, visual assets and navigation ([M:141-153](#source-m)) | Baseline inventory | Baseline records and check_site cover routes/CWIDs and phone/tablet/desktop navigation | COMPLETE | [EV-BASE](#ev-base); [EV-PRES](#ev-pres) | None for baseline snapshot | Inventory can be compared with release artifact | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Recorded baseline, not release approval; no final transformation approval |
| <a id="base-03"></a>**BASE-03** | Record search, accessibility, performance, PWA, SEO and test coverage/limitations ([M:147-153](#source-m)) | Known starting capabilities and gaps | Source map, bounded browser/lab reports and limitation records exist | COMPLETE | [EV-BASE](#ev-base); [EV-PRES](#ev-pres) | None for baseline recording | Measured evidence distinguished from unverified support | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Recorded baseline, not release approval; no final transformation approval |
| <a id="base-04"></a>**BASE-04** | Capture desktop/tablet/phone before images and reproducible baseline ([M:155;161](#source-m)) | Saved visual comparison reference | Five baseline widths 200/no overflow/no page exceptions; screenshots exist | COMPLETE | [EV-BASE](#ev-base); [EV-PRES](#ev-pres) | None for baseline capture | Images and capture report retained under work/transformation/baseline | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Recorded baseline, not release approval; no final transformation approval |
| <a id="base-05"></a>**BASE-05** | Separate confirmed defects/fixes from improvements ([M:157-159](#source-m)) | Defect ledger | Search-toggle/backdrop, contrast, offline and storage repairs have red/green evidence | COMPLETE | [EV-BASE](#ev-base); [EV-PRES](#ev-pres) | None for initial ledger; newly found defects remain R1 | Defect identity, source, fix and regression distinguish feature scope | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Recorded baseline, not release approval; no final transformation approval |

### Global design and responsive refinement

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="des-01"></a>**DES-01** | Retain devotional maroon/gold/ivory/parchment identity and traditional hierarchy, not generic dashboard ([M:165-200](#source-m)) | Coherent approved visual family | Shared approved tokens/art reused; automated representative checks pass | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | Complete owner visual comparison across supported page types | Owner signs off representative whole flows without identity loss | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |
| <a id="des-02"></a>**DES-02** | Reduce clutter and unify color/type/spacing/radius/shadow/motion/state/dark/contrast/breakpoint tokens ([M:183-196](#source-m)) | Reusable design system | Shared CSS and practice styles reuse tokens; full state/layout judgment not established | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | Review all representative component states against token map | No detached styles or unreadable/cluttered states in accepted sample | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |
| <a id="des-03"></a>**DES-03** | Adapt small/standard/large phones, tablets both orientations, split/wide desktops and installed PWA ([M:204-213](#source-m)) | Supported viewport matrix | Chromium widths 320/375/768/1024/1440 and split transitions tested | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | Actual orientation/standalone and agreed browser-engine checks | Controls remain available in agreed viewport/platform matrix | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |
| <a id="des-04"></a>**DES-04** | Prevent missing controls, overlap, horizontal overflow and compressed navigation ([M:215](#source-m)) | Usable responsive controls | Automation covers category/page types and keyboard-sized viewport recovery | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | Complete real keyboard/zoom/installed-app review | No lost controls, horizontal scrolling or obstructed tasks | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |
| <a id="des-05"></a>**DES-05** | Respect safe areas and browser zoom ([M:217](#source-m)) | Safe-area/zoom usability | Safe-area CSS/enlarged text exist; enlarged text is not real browser zoom | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | Verify real zoom and device safe-area behavior | Content/fixed controls do not overlap at agreed zoom and device insets | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |
| <a id="des-06"></a>**DES-06** | Unified readable traditional premium result ([M:219;963-964](#source-m)) | Accepted visual composition | No final whole-transformation owner acceptance recorded | BLOCKED | [EV-DES](#ev-des); [EV-HEADER](#ev-header) | R7 owner comparison of final staged artifact | Owner approval references exact reviewed screens/artifact | R7; prerequisites and external review in the linked roadmap package. | Baseline deployed; preview additions not approved; no final transformation approval |

### Homepage and Daily Darshan

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="home-01"></a>**HOME-01** | Preserve temple-ghat hero/composition; restrained light/depth/gold/transition/focus effects where appropriate ([M:225-240](#source-m)) | Enhanced existing hero without heavy video/particles | Approved hero retained; existing CSS lighting/transitions and state styling reused | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | None for conditional effect constraint | No unnecessary artwork replacement or heavy animation dependency | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-02"></a>**HOME-02** | Provide reduced-motion fallbacks ([M:240-242](#source-m)) | Optional motion honors preferences | Existing reduced-motion/stopped-animation styles and tests | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | None for bounded motion implementation | Motion can be disabled without losing controls | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-03"></a>**HOME-03** | Prominent Daily Darshan with date and one existing local Panchang summary ([M:244-251](#source-m)) | Daily entry module | daily_darshan embeds one authoritative summary; shared city/calculation behavior preserved | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | None for implemented Daily component | Date/local summary render once and location controls still work | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-04"></a>**HOME-04** | Observance/context/deity/work/prayer discovery must be justified; neutral fallback allowed ([M:252-263](#source-m)) | Honest validated discovery rather than invented daily association | Explicit neutral links and Panchang observance discovery; no prescribed deity/work claim | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | No new recommendation dataset required under permitted fallback | Unjustified recommendation is absent; neutral discovery remains useful | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-05"></a>**HOME-05** | Direct Japa plus saved reading/practice continuation ([M:256-257](#source-m)) | Resume available meaningful activity | Japa resume reads numeric old store; preview Reader continuation reads explicit flags | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | None for bounded pilot/resume component | Missing/corrupt flags do not create false progress; valid flags reveal real links | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-06"></a>**HOME-06** | Guided daily prayer/deities/texts/festivals/finder/journey paths; preserve canonical access ([M:265-278](#source-m)) | Real task entry points | Six verified existing routes, categories/finder retained; discovery labelled informal | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | None for bounded entry-path component | Every displayed destination exists and canonical categories are not renamed | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |
| <a id="home-07"></a>**HOME-07** | Visitor can understand collection and start immediately ([M:280;965](#source-m)) | Immediate supported activity | Browser tests verify all Daily destinations, targets, contrast and containment across ten cases | COMPLETE | [EV-HOME](#ev-home); [EV-HEADER](#ev-header) | Owner visual judgment handled separately by DES-06 | Guest starts prayer/reading/discovery without account or fabricated recommendation | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Daily public; Reader/Sanctuary resume preview-only; no final transformation approval |

### Devotional Sanctuary

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="san-01"></a>**SAN-01** | Optional calm respectful environment; digital aids not ritual substitutes ([M:284-305](#source-m)) | Dedicated Sanctuary with honest scope | sanctuary page states optional aids/no spiritual outcome; no sign-in | COMPLETE | [EV-PRACTICE](#ev-practice) | None for functional scope | Entry/exit work and digital nature is explicit | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |
| <a id="san-02"></a>**SAN-02** | Diya, deliberate bell, flower offering and approved deity portrait ([M:292-297](#source-m)) | Core devotional interactions | Diya/flowers/Ganesha/synthesized bell controls implemented and exercised | COMPLETE | [EV-PRACTICE](#ev-practice) | Actual audio/platform observation remains quality work | Controls work with sound off and portrait identity is approved | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |
| <a id="san-03"></a>**SAN-03** | Guided prayer or reflection, existing Japa integration, optional session length ([M:298-300](#source-m)) | Reflection, authoritative Japa link and 5/10/20 timers | Neutral reflection, original counter link and query-driven timers | COMPLETE | [EV-PRACTICE](#ev-practice) | None for bounded functional component | Timer can start/stop; Japa is not duplicated or reset | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |
| <a id="san-04"></a>**SAN-04** | Quiet mode and independent visual/sound controls ([M:301;315](#source-m)) | User-controlled calm experience | Quiet disables sound/effects, closes audio; effects independent | COMPLETE | [EV-PRACTICE](#ev-practice) | None for implementation scope | Quiet/effects/sound states operate independently with clear feedback | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |
| <a id="san-05"></a>**SAN-05** | Ambient recordings only when legally available; default-off/no autoplay; functional silence ([M:309-319](#source-m)) | Honest audio-free fallback | No licensed ambient recordings bundled; optional synthesized tone disclosed | COMPLETE | [EV-PRACTICE](#ev-practice) | Recordings optional, not an original mandatory blocker | No unsolicited/unlicensed sound; all tasks function without audio | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |
| <a id="san-06"></a>**SAN-06** | Local preferences, no required sign-in; smooth navigation/lifecycle ([M:321-327](#source-m)) | Local effects preference and cleaned timers/audio/listeners | AbortController/timer/audio cleanup and no-account flows tested | COMPLETE | [EV-PRACTICE](#ev-practice) | Cross-cutting future-record compatibility remains PRE-05/R1 | Leave/reenter without orphan session or unsolicited sound | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only, no final approval; no final transformation approval |

### Source-verified Sacred Reader

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="rdr-01"></a>**RDR-01** | Legitimate first-party original-language Unicode, verse-oriented reading ([M:335;341-343](#source-m)) | Verified passage with stable identity | Sanskrit Gita 2.47 with lang/Unicode/anchor and Telang 1882 English | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | None for current passage content | Exact text/source identity preserved and readable without JS | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-02"></a>**RDR-02** | Verified transliteration support ([M:344](#source-m)) | Source/rights-reviewed transliteration in pilot | Page explicitly states transliteration not bundled; no control/content source | NOT STARTED | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Add sourced transliteration and separate review | Approved transliteration matches exact passage and has provenance/rights | R2 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-03"></a>**RDR-03** | Verified translation/explanation where available; source attribution and legal materials ([M:345-346;357-361](#source-m)) | Accurate sourced English option and rights record | Telang 1882 historical English; fixed witnesses and scanned-page hash; no modern commentary copied | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Final source/rights review remains part of release package | Original/translation attributed separately; machine text never authoritative | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-04"></a>**RDR-04** | Adjust font/spacing and light/dark reading ([M:347-349](#source-m)) | Comfortable reading controls | Size/spacing options, shared theme and high-contrast checks | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Real zoom/assistive validation remains ACC | Controls change reading presentation without altering source text | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-05"></a>**RDR-05** | Bookmarks, progress and continuation ([M:350-352](#source-m)) | Persisted explicit passage state | Single scalar bookmark/read flags and permanent anchor work | PARTIAL | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice); [EV-AF](#ev-af) | Extensible per-passage state and remaining compatibility protections | Independent passage state survives reload/navigation without destroying prior data | R2 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-06"></a>**RDR-06** | Print-friendly reading ([M:353](#source-m)) | Usable print layout | Existing print styles/control and print-media assertions | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | None for bounded print implementation | Passage/source remain readable in print without decorative controls | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-07"></a>**RDR-07** | Internal search where suitable ([M:354](#source-m)) | Unicode/source/English search | Single-passage Unicode search and translation-panel reveal implemented | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Multi-passage behavior belongs RDR-11 | Queries reveal matching supported passage or truthful empty fallback | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-08"></a>**RDR-08** | Share specific verified passage ([M:355](#source-m)) | Stable passage URL with native/copy/manual fallback | gita-2-47 link and sharing fallbacks tested | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | External-service preview review separately SEO | Link resolves to exact source-identified passage | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-09"></a>**RDR-09** | Never invent text/authorship/bibliography/rights or imply all works have full text ([M:357-361;367](#source-m)) | Truthful content/source boundary | Ancient/public-domain pilot separated from catalogue/external reading | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | None for inspected content boundary | No fabricated sacred content or availability claim | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-10"></a>**RDR-10** | Start with useful well-documented pilot and respectful catalogue fallback ([M:363-371](#source-m)) | Bounded pilot plus existing Library/catalogue handoff | One Sanskrit passage and English; no original promise of full 43,085-work corpus | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | No arbitrary full-corpus quota introduced | Pilot is source-checked and unsupported content points to real resources | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-11"></a>**RDR-11** | Support eventual expansion without changing authoritative catalogue ([M:365;379](#source-m)) | Extensible multi-passage/content identity contract | One hard-coded querySelector, scalar state and 0/1 progress; no second-passage proof | PARTIAL | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Bounded extensible model and migration/second-passage acceptance fixture | A second verified passage works independently; original anchor/data remain compatible | R2 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-12"></a>**RDR-12** | Recordings only with rights and exact work/source identity ([M:375-377](#source-m)) | Safe unavailable-audio behavior | No bundled recordings and explicit availability statement | COMPLETE | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Optional recordings need separate rights, not mandatory quota | No unrelated/unlicensed recording is silently substituted | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |
| <a id="rdr-13"></a>**RDR-13** | Useful verified pilot and extensible reading experience ([M:379;966](#source-m)) | Completed original Reader acceptance | Many pilot controls work; transliteration/extensibility/data safety incomplete | PARTIAL | [EV-READER](#ev-reader); [EV-PRACTICE](#ev-practice) | Close RDR-02/05/11 and R1 | Bounded pilot meets all applicable original controls and source review | R2 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; source-checked pilot, not whole corpus; no final transformation approval |

### Automatic festival experiences

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="fes-01"></a>**FES-01** | Automatic eligibility seven calendar days before start through end in India time; respect region/tradition ([M:385-397](#source-m)) | Validated regional timing engine | India-day/midnight and date/region engine, eligibility/overlap tests | COMPLETE | [EV-FESTIVAL](#ev-festival) | Real records tested separately FES-02 | Boundary cases/year/leap/region rules deterministic; no universal-date assumption | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-02"></a>**FES-02** | Use real validated year/region observance records ([M:391-397;436-442](#source-m)) | Current/upcoming reviewed festival schedule | Bundled2026 events empty; one unreviewed past MH civil-day candidate outside manifest | BLOCKED | [EV-FESTIVAL](#ev-festival) | Approve finite year/region/event inventory and actual source-reviewed records | At least agreed supported upcoming observances activate/expire from real reviewed data | R5; prerequisites and external review in the linked roadmap package. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-03"></a>**FES-03** | Immersive approved presentation while preserving layout/navigation; listed effects are possibilities ([M:399-412](#source-m)) | Agreed bounded festival visual slice | Ganesha/Shiva aside/image/link previews; not a global background/palette system | PARTIAL | [EV-FESTIVAL](#ev-festival) | Owner accepts finite presentation scope and real-data display | Approved slice looks intentional; no obligation to implement every optional effect | R5; prerequisites and external review in the linked roadmap package. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-04"></a>**FES-04** | Auto selection, original override and manual preview ([M:416-424](#source-m)) | Functional presentation modes | Auto/original/two manual design modes distinguish preview from observance | COMPLETE | [EV-FESTIVAL](#ev-festival) | None for current mode implementation | Original always wins; manual preview never asserts a real festival date | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-05"></a>**FES-05** | Disable effects, honor reduced motion, no mandatory audio and persist preferences ([M:421-424](#source-m)) | User control of presentation | Effects/reduced-motion preferences and silent presentation implemented | COMPLETE | [EV-FESTIVAL](#ev-festival) | Cross-cutting preference-format audit belongs R1 | Effects optional, audio absent/disclosed, preferences safe | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-06"></a>**FES-06** | Deterministic metadata/regional priority and access to other overlapping observances ([M:426-432](#source-m)) | Overlap selection with honest alternatives | Exact region, reviewed priority/date/ID order; alternatives retained | COMPLETE | [EV-FESTIVAL](#ev-festival) | Real-data overlap evidence needed at release | No arbitrary suppression; deterministic boundary and overlap tests pass | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-07"></a>**FES-07** | Structured year pipeline, validation and uncertainty; no recurring Gregorian guesses ([M:434-440](#source-m)) | Maintainable reviewed schedule contract | Validator/manifest/year files and review criteria exist; no populated annual process | PARTIAL | [EV-FESTIVAL](#ev-festival) | Define maintainer/update responsibility and approved supported years | Reviewed records have sources/reviewer/scope; missing data retains original theme | R5; prerequisites and external review in the linked roadmap package. | Preview engine/manual designs; no real automatic event published; no final transformation approval |
| <a id="fes-08"></a>**FES-08** | Themes really activate/deactivate respectfully without catalogue changes ([M:442;967](#source-m)) | Real automatic festival acceptance | Fictional fixtures prove engine behavior; empty real manifest cannot deliver automation | BLOCKED | [EV-FESTIVAL](#ev-festival) | Close FES-02/03/07 and reviewed real activation/expiry test | Actual reviewed schedule produces expected window and returns to original | R5; prerequisites and external review in the linked roadmap package. | Preview engine/manual designs; no real automatic event published; no final transformation approval |

### Personal devotional journeys

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="jrn-01"></a>**JRN-01** | Extend existing saved prayers/Japa/favourites in an optional dashboard ([M:448;454-455](#source-m)) | Useful local dashboard and existing saved-work access | Journey dashboard links authoritative Japa, guest favourites and Reader | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | No duplicate favourites provider required | Guest can reach existing records without copying or resetting them | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-02"></a>**JRN-02** | Continue-reading history ([M:456](#source-m)) | History/resume across supported Reader content | One passage flag and one continue anchor; no multi-item history | PARTIAL | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | Reuse completed Reader identity/progress model | Supported passages can be resumed independently without losing older progress | R3 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-03"></a>**JRN-03** | Devotional routine builder and custom prayer routines ([M:457;459](#source-m)) | Bounded routines that represent actual chosen prayers/works | Ten name/duration presets only; no prayer/work selection or ordered steps | PARTIAL | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | Agree minimal prayer routine contract and reuse canonical identities | User saves/reopens a chosen prayer routine; names/durations alone are not the full promise | R3 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-04"></a>**JRN-04** | Five-, ten-, twenty-minute sessions ([M:458](#source-m)) | Existing Sanctuary preset handoff | Validated durations and exact offline query aliases | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | None for current timer handoff | Each preset opens correct existing timer online/offline | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-05"></a>**JRN-05** | Japa session history using existing counter ([M:460](#source-m)) | Explicit finished-count history | Start/Finish deltas/timestamps, Undo/reset cancellation, cap 50 and own-list erase | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | Cross-cutting external future-record recovery remains R1 | No duplicate counter or prayer-name copying; core counting/history tests pass | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-06"></a>**JRN-06** | Optional private devotional journal ([M:461;475](#source-m)) | Opt-in plain-text local notes with clear controls | Consent,5000 limit, clear/no cloud/noindex; active Journey format guards | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | No journal cloud sync is implicitly required | Unconsented note not stored; private note never shared by tool | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-07"></a>**JRN-07** | Favourite deity/tradition shortcuts ([M:462](#source-m)) | Verified section routes separate from work favourites | Ten paths resolved against 2244 generated sections; scoped erase/cross-tab | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | No new account database needed | Actual section identity/pagination preserved and guest favourites unchanged | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-08"></a>**JRN-08** | Daily/weekly summaries without manipulative spiritual rankings/streaks ([M:463;467](#source-m)) | Honest private self-reported summaries | Today and rolling-seven-day minutes/counts; timezone disclosed; no ranking | COMPLETE | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | None for bounded summary feature | Summary matches stored sessions and makes no spiritual-outcome claim | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-09"></a>**JRN-09** | Local-first, no required account; only authorized existing sync; privacy ([M:465-475](#source-m)) | Personal choice with preserved records | Local stores/no provider change; actual account flow untested and recovery risks remain | PARTIAL | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut); [EV-AF](#ev-af) | Close R1 and authorized existing-account QA where available | No private journal cloud/public leak or data loss; no required sign-in | R3 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; baseline Japa/favourites public; no final transformation approval |
| <a id="jrn-10"></a>**JRN-10** | Resume meaningful activities cohesively without losing progress ([M:477;970](#source-m)) | Complete Journey acceptance | Many local controls work; custom prayers/history and compatibility incomplete | PARTIAL | [EV-JOURNEY](#ev-journey); [EV-JAPA](#ev-japa); [EV-SHORTCUT](#ev-shortcut) | Close JRN-02/03/09 | End-to-end chosen routine and reading history survive supported transitions | R3 (safety R1); prerequisites and external review in the linked roadmap package. | Preview-only; baseline Japa/favourites public; no final transformation approval |

### Navigation, search and discovery

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="dis-01"></a>**DIS-01** | Task-oriented navigation without weakening advanced search ([M:483-487](#source-m)) | Coherent existing-plus-new task paths | Approved six-tab header and preview discovery links work | PARTIAL | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Document whole-flow navigation evaluation | Primary tasks/new tools reachable without loss of advanced finder | R4; prerequisites and external review in the linked roadmap package. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-02"></a>**DIS-02** | Evaluate five-destination mobile model ([M:489-495](#source-m)) | Recorded comparison with approved existing navigation | No documented Home/Explore/Daily/Saved/More comparison found | NOT STARTED | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Evaluate; do not automatically replace approved six tabs | Document reasoned accessible mobile choice and owner review | R4; prerequisites and external review in the linked roadmap package. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-03"></a>**DIS-03** | Keep Library/Panchang/tools/accessibility/About/header/install/narrow controls accessible ([M:497-503](#source-m)) | Existing destinations and accessible install control | Real routes and responsive header tests; retained owner-approved design | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Physical-platform acceptance remains PWA/ACC | No existing destination or narrow/half-screen control removed | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-04"></a>**DIS-04** | Preserve identity matching, aliases, graph, ranking, multilingual search, CWIDs and routes ([M:507;521-523](#source-m)) | Canonical search correctness | Existing engine/registry unchanged; universal search/Unicode/golden assertions pass | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | None for inspected algorithm preservation | Distinct deities/traditions never merged from similar names | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-05"></a>**DIS-05** | Clear result groups and exact/alias/related identity distinctions ([M:511;515](#source-m)) | Readable disambiguated results | Existing finder renders distinct identity and related-form groups | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | None for current grouping contract | Exact/alias/context/relationship meaning remains visible | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-06"></a>**DIS-06** | Deity/work discovery cards and verified related recommendations ([M:512;514](#source-m)) | Useful related-material presentation | Existing identity list/related graph and homepage cards; no complete new work-card review | PARTIAL | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Finish agreed presentation using only verified graph links | Cards link real works/sections and distinguish recommendations from exact identity | R4; prerequisites and external review in the linked roadmap package. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-07"></a>**DIS-07** | Category shortcuts, mobile results, helpful empty states, share URLs and accessible results ([M:513;516-519](#source-m)) | Usable finder/discovery handoffs | Canonical category/language/form filters, real finder result/empty/share controls tested | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Wider quality review remains ACC | Valid URL filters survive reload/back; unsupported values not retained silently | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-08"></a>**DIS-08** | Deity pathway ([M:529](#source-m)) | Actual deity section discovery | Canonical deity links and verified section shortcuts | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | None for current pathway | Correct distinct deity destination, never inferred identity merging | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-09"></a>**DIS-09** | Devotional-form and language pathways ([M:530-531](#source-m)) | Canonical metadata facets | Explore derives actual form/language options and submits original finder | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Native-language quality separately evaluated | Options reflect real metadata and filtering remains canonical | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-10"></a>**DIS-10** | Region, tradition and festival pathways ([M:532-534](#source-m)) | Verified supported discovery routes/data | Generic category/calendar links; no structured reviewed region/tradition/festival pathways | PARTIAL | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Bound supported data/pathway inventory and explicit unsupported cases | Agreed pathways use verified relationships without new canonical classifications | R4; prerequisites and external review in the linked roadmap package. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-11"></a>**DIS-11** | Scripture pathway ([M:535](#source-m)) | Existing Books Library access | Library and reading discovery links preserved | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | No first-party full-text claim required | Visitor reaches real scripture/book reading availability | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-12"></a>**DIS-12** | Kuladevata/Kuldevi where verified data supports it ([M:536](#source-m)) | Conditional documented family-deity discovery | No reviewed supported mapping is bundled; the interface explicitly avoids invented family-deity relationships. | COMPLETE | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | No obligation to create unsupported mappings; retain the conditional verified-data boundary. | Any supported mapping is source-verified; honest unavailability is an acceptable current conditional fallback. | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |
| <a id="dis-13"></a>**DIS-13** | Familiar/less-known discovery without mastering taxonomy ([M:538;968-969](#source-m)) | Complete original discovery acceptance | Useful canonical shortcuts exist; several requested pathways and evaluation missing | PARTIAL | [EV-DISCOVERY](#ev-discovery); [EV-SEARCH](#ev-search); [EV-HEADER](#ev-header) | Close DIS-01/02/06/10 and retain the conditional DIS-12 boundary. | Representative guest tasks succeed across agreed supported dimensions | R4; prerequisites and external review in the linked roadmap package. | Baseline search/navigation public; Explore/shortcuts preview-only; no final transformation approval |

### SEO, social sharing and editorial foundation

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="seo-01"></a>**SEO-01** | Accurate titles, descriptions and canonicals ([M:550-552](#source-m)) | Correct generated head metadata | Template and whole-artifact metadata checks validate title/description/canonical parity | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Specific work/editorial landing scope separate SEO-07 | Every generated page has appropriate title, description and canonical URL | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-02"></a>**SEO-02** | Sitemap, robots and internal links ([M:553-555](#source-m)) | Crawlable public content and excluded private interfaces | Generated sitemap/link checks; Journey noindex and no share; unsupported preview routes omitted by default | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Search-engine indexing itself is not controlled by code | Valid sitemap/internal URLs and private content not indexed or shared | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-03"></a>**SEO-03** | Accurate structured data, breadcrumb metadata and image descriptions; no fake ratings/FAQ/reviews ([M:556-558;564-566](#source-m)) | Truthful semantic markup | WebPage/BreadcrumbList and image identity/alt tests; no fake rich-result claims | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Manual accessible image context remains ACC | JSON-LD types/content are accurate and breadcrumb destinations exist | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-04"></a>**SEO-04** | Handle duplication/crawlability without mass thin pages ([M:559-560;568](#source-m)) | Useful canonical/duplicate strategy | Canonical/pagination and generated-route checks exist; no full duplicate-content review | PARTIAL | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Audit representative pagination/query/identity landing patterns | No misleading canonical or unreviewed near-duplicate SEO proliferation | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-05"></a>**SEO-05** | Preserve multilingual search presentation without equating transliteration and translation ([M:561;824-826](#source-m)) | Honest supported-language discovery | Canonical multilingual search intact; local text coverage incomplete and excludes source/private text | PARTIAL | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Reconcile baseline language support and separately adopted L1 coverage | Labels/search meanings are reviewed; transliteration never called translation | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-06"></a>**SEO-06** | Useful source-backed editorial structure and templates for six named content genres ([M:570;601-610](#source-m)) | Maintainable reviewed article template | Unpublished maintenance template has scope/tradition/sources/rights/corrections and canonical-link guidance | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | No mandatory article quota is invented from genre examples | Future reviewed article can be authored without editing core app code | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-07"></a>**SEO-07** | Important deity and devotional-work landing experiences ([M:562](#source-m)) | Agreed useful canonical landing scope | Deity category pages and anchored work rows exist; no accepted important-work inventory | PARTIAL | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Choose bounded important entries and verify direct landing/metadata/usefulness | Selected real destinations represent exact identities without thin mass-generated content | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-08"></a>**SEO-08** | Correct Open Graph/social cards using approved branded images ([M:574-577](#source-m)) | Recognizable valid social metadata | Absolute approved512 image and all-page OG/Twitter metadata checks | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | External rendering separately SEO-09 | Metadata/asset URLs correct under nested Pages paths | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-09"></a>**SEO-09** | Appropriate preview for home/deity/festival/Reader/educational/work pages ([M:578-585](#source-m)) | Validated content-type share previews | Generic metadata exists; festival/editorial/work-specific real content coverage incomplete | PARTIAL | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Complete supported landing inventory and inspect available platform previews | Each applicable published type shares accurate title/image/context; no private data | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-10"></a>**SEO-10** | Mobile native sharing with clipboard/manual fallback ([M:587](#source-m)) | Functional public sharing controls | Native/clipboard/manual fallback in Reader and public-page controls; private Journey excluded | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Real browser share behavior in supported-platform review | Cancellation does not report success; fallback URL targets exact public content | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-11"></a>**SEO-11** | Owner-approved repository description, topics and documentation ([M:591](#source-m)) | Discoverable public repository identity | Public API reports description:null and topics:[]; homepage is configured | NOT STARTED | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Prepare accurate description/topics and obtain owner branding approval | Approved settings and documentation describe actual HDC without unsupported claims | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-12"></a>**SEO-12** | Use HDC — Hindu Devotional Collection consistently; no unrelated identity ([M:593-597](#source-m)) | Canonical public branding | Config/header/page branding HDC; legacy technical prefixes deliberately compatible | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Legacy IDs not cosmetically renamed | Current brand presentation is HDC; compatibility identifiers stay safe | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-13"></a>**SEO-13** | Analytics only when authorized, covering seven specified metrics if enabled ([M:614-624](#source-m)) | Privacy-controlled optional measurement | No new tracking installed; no authorization evidence | COMPLETE | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Optional analytics excluded from mandatory original completion target | No secret tracking; any future authorization defines metrics/privacy before installation | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |
| <a id="seo-14"></a>**SEO-14** | Strong technical discoverability without ranking/popularity guarantees ([M:626;628;972-973](#source-m)) | Evidence-backed discovery foundation | Metadata/link/template foundations exist; actual indexing/external-preview coverage not fully assessed | PARTIAL | [EV-SEO](#ev-seo); [EV-REPO](#ev-repo) | Close supported SEO acceptance, disclose unavailable external service data | No traffic/ranking guarantee; useful crawl/share checks documented | R6; prerequisites and external review in the linked roadmap package. | Baseline metadata public; new breadcrumb/share interfaces preview-only; no final transformation approval |

### Installation, mobile and offline lifecycle

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="pwa-01"></a>**PWA-01** | Preserve installation flow and explicit install controls ([M:634;640](#source-m)) | Truthful browser-dependent install behavior | Prompt capture/user gesture/outcomes/unsupported/iOS guidance implemented; automated mocks used | PARTIAL | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Observe actual supported native install flow | No unsolicited prompt or false installed success; real supported flow works | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-02"></a>**PWA-02** | Manifest, /devotional/ scope and stable start URL ([M:641-643](#source-m)) | Correct application paths | Live manifest 200; scoped manifest/start/asset path tests | COMPLETE | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | None for observed configuration | Manifest/icons/worker URLs resolve within intended Pages scope | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-03"></a>**PWA-03** | Supported Android behavior and iOS instructions ([M:644-645](#source-m)) | Actual platform support evidence | Chromium Android/UA behavior and iOS guidance branches tested with mocks | PARTIAL | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Test agreed real Android and iOS/Safari paths | Native/browser guidance is accurate on actual supported platform | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-04"></a>**PWA-04** | Consistent approved icons/maskable safe area and light/dark appearance ([M:646-648;656-658](#source-m)) | Usable installed identity from approved master | Approved assets and reviewed PR 53 maskable correction retained; safe-area geometry tested | PARTIAL | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Check actual launcher appearance and both modes | Icon identity remains approved and launcher masking stays legible | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-05"></a>**PWA-05** | Standalone navigation ([M:649](#source-m)) | Installed-app navigation evidence | Mock standalone mode exercises controls; no actual installed-app test | PARTIAL | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Observe navigation/back/safe-area in supported installed app | No trapped navigation, hidden primary control or content overlap | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-06"></a>**PWA-06** | Service-worker lifecycle, offline shell, cache update and version transitions ([M:650-653](#source-m)) | Tested real worker lifecycle | Real worker offline/install-failure/upgrade tests pass; old-version strategy is a test fixture | COMPLETE | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | All historical workers are not certified by fixture | Supported old/new scenario preserves unrelated caches and user stores | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-07"></a>**PWA-07** | No stale visual assets after deployment ([M:654](#source-m)) | Post-launch asset-version verification | Version signatures cover code/art/data; new release not deployed | BLOCKED | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Verify exact approved live release after authorized launch | Live asset bytes/version and update path match approved candidate | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-08"></a>**PWA-08** | Useful efficient offline behavior and online recovery ([M:651-653;672](#source-m)) | Bounded supported offline task set | First-install 5/10/20, Reader/Japa and real search shell tested; large search/section metadata on demand | COMPLETE | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Unvisited whole-site offline not promised | Documented shell tasks work offline; recovery preserves state | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-09"></a>**PWA-09** | Do not replace approved artwork without explicit fix review ([M:656-658](#source-m)) | Controlled asset provenance | PR 51 introduces no hero/brand artwork substitution; upstream owner-reviewed icon fix explicit | COMPLETE | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | None for inspected source change boundary | Any necessary asset fix has provenance and approval record | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |
| <a id="pwa-10"></a>**PWA-10** | Coherent polished PWA across phones/tablets/desktops/installed environments ([M:704;971](#source-m)) | Accepted supported-platform experience | Substantive Chromium/worker automation; actual installed/device checks incomplete | PARTIAL | [EV-PWA](#ev-pwa); [EV-HEADER](#ev-header) | Close PWA-01/03/04/05 and final owner visual review | Supported-platform task matrix passes without assuming UA mocks equal devices | R7/R9; prerequisites and external review in the linked roadmap package. | Existing install/worker public; new offline practice shell preview-only; no final transformation approval |

### Performance and load efficiency

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="per-01"></a>**PER-01** | Responsive compressed images and appropriate lazy loading ([M:664-666](#source-m)) | Efficient visual loading | Local webp/srcset/lazy patterns and retained hero priority exist | PARTIAL | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Review responsive requests and important image loading under realistic load | Images are legible, sized and scheduled appropriately on supported viewports | R8; prerequisites and external review in the linked roadmap package. | Measured local preview only; no field claim; no final transformation approval |
| <a id="per-02"></a>**PER-02** | Minimal first-load JS, reuse, defer nonessential features, no needless deps/heavy engines ([M:667-671;814-818](#source-m)) | Bounded progressive-enhancement cost | No new dependency/heavy engine; new scripts globally activated in preview and budgets checked | PARTIAL | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Profile/defer noncritical work if measured necessary | First-load/task cost measured; no unneeded engine/provider/dependency | R8; prerequisites and external review in the linked roadmap package. | Measured local preview only; no field claim; no final transformation approval |
| <a id="per-03"></a>**PER-03** | Efficient cache and generated page size where practical ([M:672-673](#source-m)) | Measured artifact budgets and practical page sizing | 100 KiB feature/4 MiB helper budgets pass; section pagination exists | PARTIAL | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Profile meaningful generated/low-end network cases | Budget and practical rendering/caching targets met without hiding missing content | R8; prerequisites and external review in the linked roadmap package. | Measured local preview only; no field claim; no final transformation approval |
| <a id="per-04"></a>**PER-04** | Target LCP&lt;=2.5 s, INP&lt;=200 ms, CLS&lt;=0.1 ([M:675-679](#source-m)) | Appropriate performance acceptance measurements | Short unthrottled local LCP/CLS samples; no INP measurement | PARTIAL | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Measure realistic load and input interactions; remediate confirmed issues | Documented supported-load tests address all three targets and remaining limits | R8; prerequisites and external review in the linked roadmap package. | Measured local preview only; no field claim; no final transformation approval |
| <a id="per-05"></a>**PER-05** | Use field data where available; do not claim field success from simulation ([M:681-683](#source-m)) | Honest performance assessment | Reports explicitly local, fonts stubbed,1 s observation; field/INP not claimed | COMPLETE | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Field absence alone is not an invented mandatory certification blocker | Method/limitations explicit; available field evidence handled separately | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Measured local preview only; no field claim; no final transformation approval |
| <a id="per-06"></a>**PER-06** | No significant performance regression ([M:704;976](#source-m)) | Validated runtime quality | Latest local CLS low; old 1.97 shift observation is not current confirmed defect | PARTIAL | [EV-PERF](#ev-perf); [EV-DES](#ev-des) | Reproduce/load/profile before any speculative design change | No material supported-task regression in agreed realistic measurement plan | R8; prerequisites and external review in the linked roadmap package. | Measured local preview only; no field claim; no final transformation approval |

### Accessibility and interaction acceptance

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="acc-01"></a>**ACC-01** | Keyboard-only and screen-reader use ([M:687-692;750](#source-m)) | Accessible core tasks beyond DOM labels | Keyboard/focus assertions exist; actual screen-reader observation not recorded | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Run supported assistive/browser journeys | All core tasks announced/navigable with agreed screen reader and keyboard | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-02"></a>**ACC-02** | Reduced motion and high contrast ([M:693-694](#source-m)) | Usable preference states | Existing preferences, stopped animation and interaction contrast tested | COMPLETE | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Wider art/state review belongs ACC-07 | Effects honor reduction and representative text remains readable | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-03"></a>**ACC-03** | Headings, focus management and meaningful labels ([M:695-697](#source-m)) | Semantic, understandable controls | h 1 checks, many ARIA/labels/focus/dialog assertions; incomplete whole workflow/manual review | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Check final introduced component/state matrix | No skipped semantic context, inaccessible label or lost focus in supported task | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-04"></a>**ACC-04** | Readable typography, browser zoom and enlargement ([M:698-699](#source-m)) | Comfortable reading at zoom | Large-font/spacing checks exist, not actual browser zoom proof | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Verify actual zoom and text expansion on supported pages | Tasks/readability remain usable without clipping or overlap | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-05"></a>**ACC-05** | Touch targets ([M:700](#source-m)) | Touch-friendly controls | New feature tests assert 44 px controls; baseline responsive suites retained | COMPLETE | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Real touch interaction remains supported-device review | Representative controls meet required target sizes without losing neighbors | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-06"></a>**ACC-06** | Colour contrast in light/dark/high contrast and interaction states ([M:701](#source-m)) | Readable supported visual states | Solid-surface/focus contrast checks corrected known orange accent failure | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Review artwork/gradient/disabled/hover/error states and real devices | Applicable text/control contrast meets AA throughout accepted state matrix | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-07"></a>**ACC-07** | Accessible dialogs and modals ([M:702](#source-m)) | Keyboard/screen-reader-safe interactions | Counter dialogs and menu/escape controls have automation; no complete AT review | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Observe focus entry/trap/escape/return and announcement behavior | Every new/core dialog has meaningful name and recoverable focus | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |
| <a id="acc-08"></a>**ACC-08** | No significant accessibility regression with visual comparisons ([M:704;750-752;976](#source-m)) | Accepted accessible supported-device experience | Screenshots and Chromium cases exist; no final human acceptance | PARTIAL | [EV-DES](#ev-des); [EV-HEADER](#ev-header); [EV-QA](#ev-qa) | Complete R7 review on exact candidate | Document observed exceptions/fixes and obtain final staged acceptance | R7; prerequisites and external review in the linked roadmap package. | Baseline controls public; final acceptance unapproved; no final transformation approval |

### Integration, regression and release assurance

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="qa-01"></a>**QA-01** | One integrated candidate with cross-feature conflicts resolved ([M:712-714](#source-m)) | Frozen source/artifact identity | Integration head 00e includes main 7e88; latest main 2153/PR 56 is unintegrated and mergeability is false; old-head CI and functional gaps remain | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Finish all required packages before freezing final candidate | No unresolved product/data conflict in accepted artifact | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-02"></a>**QA-02** | Strict build/site/nav/search/mobile/astro/translation/art/PWA/access/responsive/feedback tests and new feature tests ([M:718-734](#source-m)) | Complete applicable automated regression | CI83 passed 00e with older baseline; current-main PR 56/prose/worker integration has not been tested together | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Reconcile latest main and run all applicable tests on the combined final candidate; old green checks are not transferred | All applicable current-base checks pass on the actual inspected candidate with exact provenance | R1 baseline reconciliation and R9 complete-candidate checks; preserve upstream and gated safeguards. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-03"></a>**QA-03** | Widths 320/375/768/1024/1440 plus narrow/landscape, light/dark ([M:738-748](#source-m)) | Representative browser/view matrix | Chromium viewport/theme suites broad; true engine/landscape/installed coverage incomplete | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Complete supported-browser/device acceptance | Agreed actual browser/view tasks pass, not merely same-engine width mocks | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-04"></a>**QA-04** | Keyboard, reduced motion, enlarged text and baseline image comparison ([M:750-752](#source-m)) | Reviewed visual/accessibility evidence | Automated checks/captures exist; no final complete human comparison | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Close R7 and record exact screenshots/artifact | Reviewed final views match approved identity and accessible behavior | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-05"></a>**QA-05** | Festival overlap/seven-day/expiry/India-time/unsupported data special cases ([M:758-762](#source-m)) | Real plus synthetic festival acceptance | Synthetic boundary fixtures pass; real reviewed registry empty | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Real supported schedule acceptance after R5 | Actual approved records and edge fixtures both produce expected fallback/timing | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-06"></a>**QA-06** | Offline install/recovery/old-cache upgrade and favourites/Japa preservation ([M:763-766](#source-m)) | Compatible offline/user-data transition | Substantive real-worker fixtures pass; new-store recovery audit risks unresolved | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live); [EV-AF](#ev-af) | Close R1 and supported actual installation/update check | No saved data loss and accepted offline tasks survive supported update/recovery | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-07"></a>**QA-07** | Guest use, invalid/missing Reader, unavailable audio and disabled effects ([M:767-770](#source-m)) | Safe accessible optional fallback behavior | Guest/no-JS/default-off audio, unmatched query and malformed progress cases exercised; missing passage and unsupported AudioContext execution not evidenced. | PARTIAL | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Exercise actual missing/invalid passage payload and unavailable audio fallback, then retain regression coverage in R2/R7/R9. | Guest and true unavailable-content/audio cases have executable evidence; no required account, fake content or lost fallback links. | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-08"></a>**QA-08** | Keyboard-open mobile, half-width navigation, Unicode, correct deity images, links/PDF/Pages paths ([M:771-777](#source-m)) | Reliable existing navigation and source identity | Current source/CI includes focused mobile recovery, search/art/link/PDF checks | COMPLETE | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Physical-browser support separately R7 | Implemented supported cases pass without altering canonical identities | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-09"></a>**QA-09** | Never release broken primary nav/search/catalogue/astro/text/data/install/access/routes/rights ([M:781-794](#source-m)) | No hard release defect | Known new-store risks and unavailable product/content acceptance prevent clearance | BLOCKED | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Close every hard gate and findings list | No known mandatory release-blocking defect remains | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |
| <a id="qa-10"></a>**QA-10** | One complete release passes functional, visual, accessibility and regression checks ([M:796](#source-m)) | Final integrated acceptance | Green automated current head is not complete product/owner approval | BLOCKED | [EV-QA](#ev-qa); [EV-PRES](#ev-pres); [EV-LIVE](#ev-live) | Complete R1-R8, exact final head checks and owner staging review | All applicable original criteria and adopted release gates signed off | R9; prerequisites and external review in the linked roadmap package. | Exact-head CI passed; final release not approved; no final transformation approval |

### Architecture, identity and maintenance guardrails

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="arc-01"></a>**ARC-01** | Use existing MkDocs/Material/generator; follow AGENTS; no generated-site source edits ([M:802-810](#source-m)) | Maintainable native architecture | No framework/backend migration; source in hooks/theme/docs; site ignored | COMPLETE | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | None for architecture boundary | Build stays native and generated output uncommitted | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Source guardrails retained; some language/data acceptance open; no final transformation approval |
| <a id="arc-02"></a>**ARC-02** | Reuse contracts/tokens/native utilities; justify dependencies; no unauthorized paid/auth/database/tracking services/secrets ([M:814-820](#source-m)) | Compatible dependency/provider boundary | Existing contracts and native browser tools; no new dependency/provider/config change | COMPLETE | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | None for inspected scope | No unnecessary external service, secret or unapproved dependency | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Source guardrails retained; some language/data acceptance open; no final transformation approval |
| <a id="arc-03"></a>**ARC-03** | Respect rights/traditions/identity and never publish fabricated placeholders as real material ([M:822;828](#source-m)) | Source/rights integrity | Ancient/1882 pilot sourced; festival fixtures isolated; real manifest empty | COMPLETE | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | New content still requires review before release | No unsupported source/date/identity/rights claim enters public content | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Source guardrails retained; some language/data acceptance open; no final transformation approval |
| <a id="arc-04"></a>**ARC-04** | Preserve English/Hindi/regional-language experience; never call transliteration translation ([M:824-826](#source-m)) | Honest language continuity | Main PR 54 replaced Google with local foundation; incomplete hosted coverage and native quality | PARTIAL | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | Reconcile original preservation with separately adopted L1 full-page requirement | Supported language behavior reviewed; source text and private inputs protected | R1/R9; prerequisites and external review in the linked roadmap package. | Source guardrails retained; some language/data acceptance open; no final transformation approval |
| <a id="arc-05"></a>**ARC-05** | New features documented and appropriately tested ([M:830](#source-m)) | Maintainable implemented code | Feature docs and CI regressions exist, including truthful failed/interrupted histories | COMPLETE | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | New/changed feature work must continue same discipline | Tests/docs match actual implemented contracts; no unrun work called complete | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | Source guardrails retained; some language/data acceptance open; no final transformation approval |
| <a id="arc-06"></a>**ARC-06** | Safe file-owned parallelism, serialize shared infrastructure, durable recovery, no unexecuted-complete claims ([M:842-865](#source-m)) | Repeatable collaborative maintenance | Separate worktrees and incremental recovery records exist; status history needs audit reconciliation | PARTIAL | [EV-GIT](#ev-git); [EV-PRES](#ev-pres); [EV-LANG](#ev-lang) | Use this fixed dashboard/roadmap and exact-head evidence | No concurrent shared-file collision or ambiguous completion ledger | R1/R9; prerequisites and external review in the linked roadmap package. | Source guardrails retained; some language/data acceptance open; no final transformation approval |

### Final delivery and termination conditions

| ID | Original requirement / source | Expected deliverable | Actual implementation | Status | Verified evidence | Missing work | Acceptance criterion | Dependencies | Release state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <a id="del-01"></a>**DEL-01** | Complete feature inventory, one final branch/PR and concise increment history ([M:911-915](#source-m)) | Owner-readable final release package | Branch/PR 51 and commits exist; completion audit replacing partial tracker | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Close all deliverable gaps then package exact candidate | Inventory separates implemented/tested/approved/deployed and lists all deferrals | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-02"></a>**DEL-02** | Full automated-test report ([M:916](#source-m)) | Exact final candidate report | Exact 00e CI success; local full 45 on 566 and selected8/7, not full 47 | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Run/archive complete final-head matrix when scope closes | Do not attribute past report to newer source; all required checks accounted | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-03"></a>**DEL-03** | Desktop/tablet/mobile comparisons, accessibility/performance/PWA/SEO/share assessment ([M:917-921](#source-m)) | Complete honest quality dossier | Substantial screenshots and bounded automated/lab reports; human/device/input gaps remain | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Close R6-R8 and produce exact-candidate dossier | Evidence states methods, limitations and actual reviewed artifact | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-04"></a>**DEL-04** | External requirements and deferred features with reasons ([M:922-923](#source-m)) | Explicit bounded limitations and permissions register | Several feature docs disclose assets/review/account limits; no agreed finite consolidated register before audit | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | This audit establishes register; owner accepts conditional scope | No optional feature silently becomes a hard gate or vanishes from disclosure | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-05"></a>**DEL-05** | Rollback procedure ([M:924](#source-m)) | Tested, data-safe rollback instructions | Reviewed-revert/flag-off guidance exists; final release rollback not rehearsed | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Rehearse final candidate worker/config reversal preserving data | Owner can revert release without canonical/user-data loss | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-06"></a>**DEL-06** | Final launch checklist ([M:925](#source-m)) | Operational exact-artifact checklist | No completed final coordinated-launch checklist/enablement record | NOT STARTED | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Prepare after scope closure, not by publicly enabling now | Checklist covers gate, build, assets/worker, routes, rollback and live verification | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-07"></a>**DEL-07** | Do not label finished or release incomplete work; keep flags OFF until approval ([M:927-929;933-955](#source-m)) | Honest protected handoff | PR 51 stays draft and preview gate OFF in ordinary deploy; current task documentation-only | COMPLETE | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Historical PR 49/50 exception remains disclosed in GOV-04 | No merge or deployment during this audit | No additional implementation for this bounded criterion; cross-cutting final acceptance remains. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-08"></a>**DEL-08** | Authentic, usable, discoverable, cohesive, accessible verified single release ([M:959-977](#source-m)) | All original outcome acceptance | Baseline/Daily and many prototypes work; several mandatory packages open | BLOCKED | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Close traceability gaps and final owner acceptance | Every mandatory row complete or explicit owner-approved conditional resolution; authorized launch verified | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |
| <a id="del-09"></a>**DEL-09** | Proceed from audit through original increments 1-10; final supporting evidence and one launch ([M:985-1007](#source-m)) | Finite bounded completion path | Original 11 stages identifiable; old micro-increment stream not a completion denominator | PARTIAL | [EV-QA](#ev-qa); [EV-GIT](#ev-git); [EV-LIVE](#ev-live) | Use the fixed R1-R9 roadmap, separate adopted scope and authorization | Work terminates at final acceptance/authorized live verification, not endless next commits | R9 then authorized launch; prerequisites and external review in the linked roadmap package. | No final approval or coordinated deployment; no final transformation approval |

## Original source coverage ledger

Ranges below cover the complete source, including repeated governance and final-outcome language. Repeated clauses cross-reference the same rows rather than creating artificial progress points. Bulleted groups within a row are listed explicitly in its requirement/acceptance text.

| Original section and lines | Mapped original IDs |
| --- | --- |
| 1 Mission,1-33 | GOV-01; DEL-08 |
| 2 Execution/preservation,35-118 | GOV-02–06; PRE-01–10 |
| 3 Baseline,120-163 | BASE-01–05 |
| 4 Design,165-221 | DES-01–06 |
| 5 Homepage/Daily,223-282 | HOME-01–07 |
| 6 Sanctuary,284-329 | SAN-01–06 |
| 7 Reader,331-381 | RDR-01–13 |
| 8 Festivals,383-444 | FES-01–08 |
| 9 Journeys,446-479 | JRN-01–10 |
| 10 Navigation/discovery,481-540 | DIS-01–13 |
| 11 SEO/editorial/metrics,542-630 | SEO-01–14 |
| 12 PWA/performance/accessibility,632-706 | PWA-01–10; PER-01–06; ACC-01–08 |
| 13 Integration/QA,708-798 | QA-01–10 |
| 14 Architecture,800-832 | PRE-01–10; ARC-01–05 |
| 15 Parallelism/recovery,834-867 | GOV-02; ARC-06 |
| 16 Progress,869-903 | GOV-07–08 |
| 17 Final delivery,905-931 | DEL-01–09 |
| 18 Single launch,933-957 | GOV-04–06; PRE-01–10; DEL-07 |
| 19 Success,959-983 | DEL-08 and every functional/quality group |
| 20 Execution,985-1007 | DEL-09; GOV-02/05/06; current audit-only instruction overrides further implementation |

## Separately adopted scope, exceptions and optional expansions

These entries are excluded from the149 original-M counts. They prevent both dropping a real owner request and silently increasing the original denominator.

| ID | Source / distinction | Current state | Exact outstanding work / acceptance |
| --- | --- | --- | --- |
| LNG-01 | Earlier owner language request; merged [PR 54](https://github.com/ashishbharani/devotional/pull/54) explicitly expands to all hosted text in English plus 9 target languages | BLOCKED / incomplete source/meaning review | 13,696 audit candidates are not 13,696 proven prose strings. Classify real prose/proper names/source/private exclusions, author missing targets, review native meaning, cover dynamic states and rerun completeness. Blank review export is preparation only. |
| LNG-02 | PR 54 local-only translator/no Google foundation; owner provider restrictions | COMPLETE for current provider boundary | No Google Website Translator restored; no new paid/provider configuration or unauthorized data transfer. |
| LNG-03 | Native-language quality and source/private boundary preservation | PARTIAL | Exclusion regressions pass but all hosted/runtime prose and meaning are not reviewed. Transliteration is not translation. |
| UP-01 | [PR 55](https://github.com/ashishbharani/devotional/pull/55): native information-page replacement and Contribution withholding | Already in main; preserve explicit exception | Do not restore withheld Contribution route/PDF or overwrite updated native pages merely to match an earlier baseline. |
| COR-01 | Search-toggle, contrast, offline and saved-data defects discovered while implementing original scope | Corrective work, not extra product features | Historical fixed defects and AF1-AF3 map to original preservation/QA requirements. Do not count repair commits as new transformation milestones. |
| OPT-01 | Full sacred corpus, extra recordings/themes, advanced rituals, new providers/analytics | Not authorized as unconditional original completion target | Treat any proposed expansion separately. Conditional source/rights availability and explicit authorization still apply; no silent scope growth. |

## Audit uncertainties and evidence limits

- Requirement inventory is high confidence because the full original source was recovered. 149 is a normalized traceability count, not a literal bullet count, effort weight or independently approved product percentage.
- Important-work selection, minimal custom-prayer routine definition, supported festival/year/region coverage and final supported-device matrix are not yet owner-accepted finite lists. R2-R7 must record bounded choices; do not interpret this as unlimited implementation.
- Exact 00e CI proves the configured suites ran successfully, not unimplemented functionality, linguistic/theological correctness, all historical workers, physical-device install, live account sync or owner approval. Existing Firebase requests are aborted/mocked in relevant UI tests.
- Runtime-only message variants are not exhaustive in the static language audit. Counts can change with generated documentation; release must inspect meanings and context, not merely eliminate counts.
- No field dataset or real authenticated account session was inspected. Missing optional field data/recordings/analytics is disclosed, not transformed into invented certification or provider requirements.
- Live HTTP checks show observed routes/assets only. Production is not byte-for-byte claimed to equal every file in main; no complete live-link/device/account certification is made.
- AF1-AF3 are now reproduced in isolated synthetic local profiles, not observed production incidents. Other new-store format/recovery combinations still need the bounded R1 matrix. No feature fix is authorized or performed in this audit.
- Local full 45 report has dirty preparatory files and is historical. Current exact-head CI has 21 available artifact bundles, including design/worker, continuation/routine, reading, header, language, Japa/shortcuts. No APPROVED review exists; one outdated unresolved thread remains administratively open.

<a id="source-m"></a>
## Source M — recovered original transformation prompt

The numbered transcription below is documentary evidence, **not a new instruction to implement or deploy**. Current audit-only and no-deployment directions take precedence. Hash above refers to the original attachment bytes, not this numbered rendering.

````text
0001: # HDC MASTER PROMPT — COMPLETE WEBSITE TRANSFORMATION
0002: ## Project: HDC — Hindu Devotional Collection
0003: ### Execution Model: Incremental Development · Unified Integration · Single Final Launch
0004: ### Target Agent: Codex GPT-6.1 Sol — Medium
0005: 
0006: ## 1. PRIMARY MISSION
0007: 
0008: You are the lead software architect, senior full-stack developer, UI/UX designer, accessibility engineer, performance engineer, SEO strategist, QA engineer, and release coordinator for the existing HDC website.
0009: 
0010: **Production website:** https://ashishbharani.github.io/devotional/
0011: 
0012: **GitHub repository:** https://github.com/ashishbharani/devotional
0013: 
0014: Your mission is to comprehensively improve HDC, transforming it from a primarily catalogue-oriented devotional website into a highly immersive, interactive, accessible, multilingual, engaging and discoverable Hindu devotional platform.
0015: 
0016: The desired result combines:
0017: 
0018: 1. A beautiful, living digital devotional sanctuary.
0019: 2. A comprehensive, trustworthy Hindu devotional knowledge library.
0020: 3. A personalised daily devotional experience.
0021: 4. An exceptional mobile and PWA experience.
0022: 5. A source-verified multilingual sacred reading platform.
0023: 6. An immersive, automatically changing Hindu festival experience.
0024: 7. Powerful and intuitive search and discovery.
0025: 8. Integrated personal devotional tools.
0026: 9. Effective search-engine and social-media discoverability.
0027: 10. A high-performance, maintainable, future-ready website.
0028: 
0029: **CRITICAL: All enhancements must be developed incrementally, tested individually, integrated collectively, and launched together only after final verification and owner approval.**
0030: 
0031: Do not create a replacement website. Improve the existing repository and architecture.
0032: 
0033: ---
0034: 
0035: ## 2. EXECUTION RULES — READ FIRST
0036: 
0037: ### 2.1 One master operation, multiple increments
0038: 
0039: Treat this entire prompt as one continuous development assignment.
0040: 
0041: Divide the implementation into independently testable increments. Complete them sequentially or concurrently when their dependencies and file ownership allow.
0042: 
0043: For every increment:
0044: 
0045: - Inspect the existing implementation.
0046: - Identify the changes required.
0047: - Implement the smallest coherent set of changes.
0048: - Run appropriate tests.
0049: - Resolve failures.
0050: - Save the completed changes in version control.
0051: - Record a concise completion report.
0052: - Proceed automatically to the next increment.
0053: 
0054: Do not stop after producing a plan.
0055: 
0056: Do not require additional user prompts between increments.
0057: 
0058: Do not repeatedly request permission to continue ordinary development work.
0059: 
0060: If an optional feature depends on unavailable assets, credentials, paid services or legal permissions, implement a safe fallback and record the blocker. Continue with all unaffected work.
0061: 
0062: ### 2.2 Single coordinated public launch
0063: 
0064: The development may use multiple branches, commits and reviewable pull requests.
0065: 
0066: However:
0067: 
0068: **Do not release individual increments to the production website.**
0069: 
0070: Use a dedicated integration/release branch based on the current production branch.
0071: 
0072: Feature branches may be merged into this integration branch following successful tests.
0073: 
0074: Do not merge incomplete features into `main`, because the existing GitHub Pages workflow automatically deploys changes from `main`.
0075: 
0076: At the end:
0077: 
0078: 1. Integrate all completed increments.
0079: 2. Run full regression testing.
0080: 3. Perform visual and functional comparisons.
0081: 4. Resolve integration problems.
0082: 5. Produce one final release candidate.
0083: 6. Open one final, comprehensive release pull request targeting `main`.
0084: 7. Await explicit owner approval before merging or deploying.
0085: 
0086: Once approved, deploy the entire tested release through the existing GitHub Actions workflow.
0087: 
0088: Do not claim that deployment succeeded until the live website has been verified.
0089: 
0090: ### 2.3 Preserve the existing website
0091: 
0092: The current HDC website is the mandatory baseline.
0093: 
0094: Preserve:
0095: 
0096: - All existing working pages and links.
0097: - Its established maroon, gold, ivory and parchment identity.
0098: - Approved brand designs, deity images and PWA artwork.
0099: - All canonical categories, sections, subsections, works and identifiers.
0100: - The current source-of-truth data model.
0101: - Universal search and multilingual identity matching.
0102: - Hindu Panchang and astronomical calculations.
0103: - Hindu calendar, date converter and ephemeris.
0104: - Japa counter and saved preferences.
0105: - Favourites, optional sign-in and privacy protections.
0106: - PDF-related links and existing library resources.
0107: - Accessibility preferences and high-contrast support.
0108: - Existing functional navigation and installation controls.
0109: - Existing GitHub Pages deployment and offline support.
0110: - Existing content and approved visual features.
0111: 
0112: Do not delete, overwrite, simplify or silently alter any approved feature.
0113: 
0114: Do not modify the frozen HDC PDF/database or manipulate research data to achieve website objectives.
0115: 
0116: The website must remain compatible with the authoritative HDC source data and future verified editions.
0117: 
0118: ---
0119: 
0120: # 3. INCREMENT 0 — COMPLETE BASELINE AUDIT
0121: 
0122: Before implementing new features, audit the actual repository and rendered production website.
0123: 
0124: Examine the current MkDocs architecture, generator hooks, Material theme overrides, scripts, CSS, JavaScript, static assets, navigation, GitHub Actions, PWA manifest and service worker.
0125: 
0126: Pay particular attention to:
0127: 
0128: - `AGENTS.md`
0129: - `hooks/generate.py`
0130: - `hooks/royal_home.py`
0131: - `theme/main.html`
0132: - `theme/partials/`
0133: - `docs/stylesheets/`
0134: - `docs/javascripts/`
0135: - `data/collection.json`
0136: - `mkdocs.yml`
0137: - `.github/workflows/`
0138: 
0139: Inspect the current state rather than assuming the repository remains identical to an earlier version.
0140: 
0141: Create a baseline inventory covering:
0142: 
0143: - Existing functionality.
0144: - Existing routes and canonical URLs.
0145: - Current visual design and approved assets.
0146: - Desktop, tablet and phone navigation.
0147: - Search and content-discovery capabilities.
0148: - Accessibility and keyboard support.
0149: - Performance characteristics.
0150: - PWA installation and offline behaviour.
0151: - Current SEO and sharing metadata.
0152: - Current automated-test coverage.
0153: - Existing defects and incomplete functionality.
0154: 
0155: Take before-change screenshots at representative desktop, tablet and phone widths.
0156: 
0157: Identify and fix confirmed pre-existing defects where necessary for this release.
0158: 
0159: Keep a separate record of improvements and genuine bug fixes.
0160: 
0161: **Completion condition:** A documented baseline exists, and subsequent changes can be measured against it.
0162: 
0163: ---
0164: 
0165: # 4. INCREMENT 1 — GLOBAL DESIGN AND VISUAL REFINEMENT
0166: 
0167: Improve the existing interface without replacing its traditional identity.
0168: 
0169: ### Design direction
0170: 
0171: Use a refined Hindu devotional aesthetic:
0172: 
0173: - Deep maroon and wine.
0174: - Traditional gold accents.
0175: - Warm ivory and parchment.
0176: - Tasteful saffron highlights.
0177: - Selective peacock and temple-inspired colours.
0178: - Traditional serif typography balanced with highly readable interface text.
0179: - Subtle sacred motifs.
0180: - Authentic devotional visual hierarchy.
0181: - Elegant lighting, restrained depth and carefully controlled movement.
0182: 
0183: Reduce unnecessary visual clutter, competing borders, excessive decorative elements and inconsistent spacing.
0184: 
0185: Introduce consistent design tokens for:
0186: 
0187: - Colours.
0188: - Typography.
0189: - Spacing.
0190: - Border radii.
0191: - Shadows.
0192: - Animations.
0193: - Interactive states.
0194: - Dark mode.
0195: - High-contrast mode.
0196: - Mobile and tablet breakpoints.
0197: 
0198: Preserve the approved HDC identity and original layout character.
0199: 
0200: Do not introduce a generic dashboard aesthetic.
0201: 
0202: ### Responsive design
0203: 
0204: Ensure that components adapt properly to:
0205: 
0206: - Small phones.
0207: - Standard phones.
0208: - Large phones.
0209: - Tablets in portrait and landscape.
0210: - Half-width desktop browser windows.
0211: - Standard desktop screens.
0212: - Wide screens.
0213: - Installed PWA display mode.
0214: 
0215: Prevent disappearing controls, overlapping navigation, horizontal scrolling and awkward compressed layouts.
0216: 
0217: Respect device safe areas and browser zoom.
0218: 
0219: **Completion condition:** The design feels unified, readable, traditional and premium across supported devices.
0220: 
0221: ---
0222: 
0223: # 5. INCREMENT 2 — IMMERSIVE HOMEPAGE AND DAILY DARSHAN
0224: 
0225: Create a more compelling visitor experience using the existing homepage as the foundation.
0226: 
0227: ### 5.1 Enhanced hero
0228: 
0229: Preserve the approved temple-ghat hero artwork and its fundamental composition.
0230: 
0231: Enhance it with subtle, performance-conscious visual effects where appropriate:
0232: 
0233: - Soft ambient lighting.
0234: - Gentle atmospheric depth.
0235: - Restrained golden highlights.
0236: - Smooth transitions.
0237: - Elegant hover and focus states.
0238: - Seasonal and festival accents.
0239: 
0240: Do not add heavy videos, excessive particle effects or disruptive motion.
0241: 
0242: Provide reduced-motion fallbacks.
0243: 
0244: ### 5.2 Daily Darshan
0245: 
0246: Introduce a prominent Daily Darshan module.
0247: 
0248: It should connect existing validated data and available devotional content to display:
0249: 
0250: - Today's date.
0251: - Today's Panchang summary.
0252: - Applicable festival or observance.
0253: - Contextually relevant deity or tradition.
0254: - One verified devotional work.
0255: - A recommended prayer or reading.
0256: - A direct entry to the Japa counter.
0257: - Continue-reading or continue-practice controls where saved progress exists.
0258: 
0259: Do not randomly invent a deity-of-the-day association.
0260: 
0261: All recommendations must use documented relationships or explicitly editorially approved selections.
0262: 
0263: If a recommendation cannot be justified, display a neutral discovery option.
0264: 
0265: ### 5.3 Guided visitor paths
0266: 
0267: Provide concise entry points such as:
0268: 
0269: - Begin Daily Prayer.
0270: - Explore Deities.
0271: - Read Sacred Texts.
0272: - Discover Festivals.
0273: - Find a Devotional Work.
0274: - Continue My Journey.
0275: 
0276: Maintain existing category and search access.
0277: 
0278: Distinguish canonical categories from informal discovery shortcuts.
0279: 
0280: **Completion condition:** A visitor understands what HDC offers and can begin a meaningful activity immediately.
0281: 
0282: ---
0283: 
0284: # 6. INCREMENT 3 — IMMERSIVE DEVOTIONAL SANCTUARY
0285: 
0286: Introduce an optional dedicated devotional environment.
0287: 
0288: This must be respectful, calm and authentic.
0289: 
0290: ### Core interactions
0291: 
0292: Implement:
0293: 
0294: - Virtual diya lighting.
0295: - Optional temple-bell interaction.
0296: - Optional flower offering.
0297: - Approved deity portrait display.
0298: - Guided prayer or reflection mode.
0299: - Integration with the existing Japa counter.
0300: - Optional session duration.
0301: - Quiet mode.
0302: 
0303: Provide suitable visual feedback without artificial religious claims.
0304: 
0305: Virtual actions must be clearly presented as digital devotional aids, not substitutes for prescribed physical rituals.
0306: 
0307: ### Ambient experience
0308: 
0309: Allow users to choose optional ambient sound where legally usable recordings are available.
0310: 
0311: Sound must be disabled by default.
0312: 
0313: Never autoplay sound when the page loads.
0314: 
0315: Provide independent controls for sound and visual effects.
0316: 
0317: Never generate or use unlicensed copyrighted recordings.
0318: 
0319: Keep the entire experience functional without audio.
0320: 
0321: ### Personal preferences
0322: 
0323: Save settings locally unless the visitor explicitly opts into supported account synchronisation.
0324: 
0325: Do not require sign-in.
0326: 
0327: **Completion condition:** Visitors can enter and leave the devotional environment smoothly without disrupting existing site navigation.
0328: 
0329: ---
0330: 
0331: # 7. INCREMENT 4 — SOURCE-VERIFIED SACRED READER
0332: 
0333: This is one of the most strategically important additions.
0334: 
0335: Build a first-party devotional reading experience using legitimately available, verified content.
0336: 
0337: ### Reader capabilities
0338: 
0339: Support:
0340: 
0341: - Original-language text.
0342: - Correct Indic Unicode rendering.
0343: - Verse-by-verse reading where applicable.
0344: - Verified transliteration.
0345: - Verified translations or explanations where available.
0346: - Source attribution.
0347: - Adjustable font sizes.
0348: - Comfortable line spacing.
0349: - Light and dark reading modes.
0350: - Bookmarks.
0351: - Reading progress.
0352: - Continue-reading functionality.
0353: - Print-friendly layouts.
0354: - Internal search where suitable.
0355: - Sharing of specific, verified passages.
0356: 
0357: Do not manufacture Sanskrit verses, sacred texts, translations, authorship or bibliographic information.
0358: 
0359: Do not treat machine translation as an authoritative translation.
0360: 
0361: Use only public-domain, appropriately licensed or owner-authorised materials.
0362: 
0363: ### Phased content availability
0364: 
0365: The interface should support eventual expansion across the collection, but full-text availability must be distinguished from catalogue-only entries.
0366: 
0367: Do not claim that every indexed work has full text.
0368: 
0369: Begin with a well-documented pilot drawn from verified and legally usable sources.
0370: 
0371: Provide a respectful fallback to existing catalogue links when a full text is unavailable.
0372: 
0373: ### Listening support
0374: 
0375: Where rights permit, associate recordings with the exact work and source.
0376: 
0377: Do not silently substitute unrelated recordings.
0378: 
0379: **Completion condition:** The reader is genuinely useful with verified pilot content and is extensible without changing the authoritative catalogue.
0380: 
0381: ---
0382: 
0383: # 8. INCREMENT 5 — AUTOMATIC HINDU FESTIVAL EXPERIENCES
0384: 
0385: Implement the previously planned immersive festival system.
0386: 
0387: ### Timing
0388: 
0389: Festival experiences should be eligible to begin seven calendar days before the applicable festival and end when the observance window concludes.
0390: 
0391: Use the existing validated Panchang/festival data where possible.
0392: 
0393: Use India time (`Asia/Kolkata`) for the India-oriented site-wide festival presentation.
0394: 
0395: Where a festival is location-sensitive, respect its region, traditions and appropriate local-calendar calculation.
0396: 
0397: Never assume every festival is observed on exactly the same date throughout India.
0398: 
0399: ### Visual experience
0400: 
0401: Festival themes may alter:
0402: 
0403: - Promotional banner.
0404: - Accent colours.
0405: - Background treatment.
0406: - Approved deity imagery.
0407: - Optional subtle visual effects.
0408: - Relevant prayers and readings.
0409: - Festival discovery cards.
0410: - Observance information.
0411: 
0412: Preserve the existing layout, content and core navigation.
0413: 
0414: ### User controls
0415: 
0416: Support:
0417: 
0418: - Automatic theme selection.
0419: - Original theme override.
0420: - Manual festival preview.
0421: - Disable festival effects.
0422: - Reduced motion.
0423: - Disable audio.
0424: - Persistent user preferences.
0425: 
0426: ### Multiple overlapping festivals
0427: 
0428: Implement a deterministic priority system based on verified festival metadata and regional relevance.
0429: 
0430: Provide access to other simultaneously applicable observances.
0431: 
0432: Do not arbitrarily suppress legitimate festivals.
0433: 
0434: ### Maintainability
0435: 
0436: Create a structured year-specific festival-data pipeline and validation tests.
0437: 
0438: Do not encode unverified recurring Gregorian dates.
0439: 
0440: Clearly mark unsupported or uncertain observance data rather than guessing.
0441: 
0442: **Completion condition:** Festival themes activate and deactivate reliably, respectfully and without modifying the underlying devotional catalogue.
0443: 
0444: ---
0445: 
0446: # 9. INCREMENT 6 — PERSONAL DEVOTIONAL JOURNEYS
0447: 
0448: Extend existing Japa, favourites and saved-work capabilities instead of building duplicate systems.
0449: 
0450: ### Features
0451: 
0452: Implement optional:
0453: 
0454: - Personal devotional dashboard.
0455: - Saved prayers and readings.
0456: - Continue-reading history.
0457: - Devotional routine builder.
0458: - Five-, ten- and twenty-minute session presets.
0459: - Custom prayer routines.
0460: - Japa session history.
0461: - Private devotional journal.
0462: - Favourite deity and tradition shortcuts.
0463: - Daily and weekly progress summaries.
0464: 
0465: Respect personal choice and privacy.
0466: 
0467: Avoid manipulative engagement features, public spiritual rankings, guilt-based streaks or promises of spiritual outcomes.
0468: 
0469: Do not make participation depend on creating an account.
0470: 
0471: Local-first storage should be the default.
0472: 
0473: Where existing authenticated synchronization is available, extend it only within the existing security model.
0474: 
0475: Never expose personal journals or devotional information publicly.
0476: 
0477: **Completion condition:** Visitors can resume meaningful activities without losing progress, while maintaining control over their personal data.
0478: 
0479: ---
0480: 
0481: # 10. INCREMENT 7 — NAVIGATION, SEARCH AND DISCOVERY
0482: 
0483: Improve navigation without weakening existing advanced search functionality.
0484: 
0485: ### Navigation
0486: 
0487: Create a more task-oriented interface.
0488: 
0489: Evaluate a five-destination mobile navigation model built around:
0490: 
0491: - Home.
0492: - Explore.
0493: - Daily.
0494: - Saved.
0495: - More.
0496: 
0497: Ensure that Library, Panchang, tools, accessibility controls, About and all existing pages remain easily reachable.
0498: 
0499: Preserve the approved HDC header and taskbar visual identity.
0500: 
0501: Retain an accessible PWA installation control in the appropriate header, taskbar or navigation location, with suitable browser-dependent installation guidance.
0502: 
0503: Ensure controls remain visible and correctly positioned in narrow and half-screen layouts.
0504: 
0505: ### Search
0506: 
0507: Preserve all existing canonical identity matching, aliases, relationships, ranking and multilingual search behaviour.
0508: 
0509: Improve presentation through:
0510: 
0511: - Clear result grouping.
0512: - Deity and work discovery cards.
0513: - Direct category shortcuts.
0514: - Recommended related material.
0515: - Clear distinctions between exact matches, aliases and related identities.
0516: - Better mobile search results.
0517: - Helpful empty-search states.
0518: - Shareable search links.
0519: - Search result accessibility.
0520: 
0521: Never merge distinct deities or traditions merely because their names appear similar.
0522: 
0523: Do not corrupt canonical work IDs or generated routes.
0524: 
0525: ### Discovery
0526: 
0527: Add pathways for:
0528: 
0529: - Deity.
0530: - Devotional form.
0531: - Language.
0532: - Region.
0533: - Tradition.
0534: - Festival.
0535: - Scripture.
0536: - Kuladevata or Kuldevi where supported by verified data.
0537: 
0538: **Completion condition:** Visitors can discover both familiar and lesser-known devotional material without needing to understand HDC's entire classification structure.
0539: 
0540: ---
0541: 
0542: # 11. INCREMENT 8 — SEO, SHARING AND PUBLIC RECOGNITION
0543: 
0544: Implement the technical foundations for significant long-term discoverability.
0545: 
0546: ### Search-engine optimization
0547: 
0548: Audit and improve:
0549: 
0550: - Page titles.
0551: - Meta descriptions.
0552: - Canonical URLs.
0553: - XML sitemap.
0554: - Robots directives.
0555: - Internal linking.
0556: - Structured data.
0557: - Breadcrumb metadata.
0558: - Image descriptions.
0559: - Duplicate-content handling.
0560: - Crawlability of generated pages.
0561: - Multilingual search presentation.
0562: - Important individual deity and devotional work landing pages.
0563: 
0564: Use accurate, relevant structured-data types.
0565: 
0566: Do not produce fabricated ratings, reviews, FAQ answers or other misleading structured data.
0567: 
0568: Avoid mass-producing thin, near-duplicate SEO pages.
0569: 
0570: Prioritise genuinely useful, original, source-backed content.
0571: 
0572: ### Social sharing
0573: 
0574: Add correct Open Graph and social card metadata.
0575: 
0576: Use approved branded images.
0577: 
0578: Support appropriate share previews for:
0579: 
0580: - Homepage.
0581: - Important deities.
0582: - Festival pages.
0583: - Sacred Reader pages.
0584: - Educational content.
0585: - Devotional works.
0586: 
0587: Create mobile-friendly sharing controls using available browser capabilities, with copy-link fallbacks.
0588: 
0589: ### Public brand presence
0590: 
0591: Improve repository discoverability through an appropriate description, topics and documentation, subject to owner-approved public branding.
0592: 
0593: Maintain consistent use of:
0594: 
0595: **HDC — Hindu Devotional Collection**
0596: 
0597: Do not create unrelated brand identities.
0598: 
0599: ### Editorial publishing
0600: 
0601: Develop a sustainable, source-verified editorial content structure for:
0602: 
0603: - Festival explanations.
0604: - Regional devotional traditions.
0605: - Lesser-known deities.
0606: - Sacred literature introductions.
0607: - Cultural heritage.
0608: - Educational discovery articles.
0609: 
0610: Provide templates that allow future publication without modifying core application code.
0611: 
0612: ### Growth metrics
0613: 
0614: Where privacy-compliant analytics are authorised, measure:
0615: 
0616: - Organic search clicks.
0617: - Indexed-page coverage.
0618: - Returning visitors.
0619: - Search engagement.
0620: - Devotional session completion.
0621: - Content shares.
0622: - PWA installation engagement.
0623: 
0624: Do not secretly install analytics or tracking tools.
0625: 
0626: Do not claim that website changes automatically guarantee rankings, traffic or popularity.
0627: 
0628: **Completion condition:** HDC has strong technical discoverability and a maintainable content-distribution foundation.
0629: 
0630: ---
0631: 
0632: # 12. INCREMENT 9 — PWA, MOBILE PERFORMANCE AND POLISH
0633: 
0634: Upgrade the existing PWA without breaking its current installation or offline systems.
0635: 
0636: ### PWA
0637: 
0638: Verify:
0639: 
0640: - Installation flow.
0641: - Manifest configuration.
0642: - Correct `/devotional/` path scope.
0643: - Stable start URL.
0644: - Supported Android behaviour.
0645: - Supported iOS installation instructions.
0646: - Icon consistency.
0647: - Maskable icon safe areas.
0648: - Dark/light theme appearance.
0649: - Standalone navigation.
0650: - Service-worker lifecycle.
0651: - Offline shell functionality.
0652: - Cache updates.
0653: - Version transitions.
0654: - No stale visual assets after deployment.
0655: 
0656: Keep all approved artwork unchanged unless an explicit fix requires a review.
0657: 
0658: Make header icons and installed-app artwork visually consistent using the approved brand master.
0659: 
0660: ### Performance
0661: 
0662: Prioritise:
0663: 
0664: - Responsive images.
0665: - Modern compressed image assets.
0666: - Appropriate lazy loading.
0667: - Minimal JavaScript on first load.
0668: - Reuse of existing scripts.
0669: - Deferred nonessential interactive features.
0670: - Avoidance of unnecessary dependencies.
0671: - No heavy animation engines by default.
0672: - Efficient offline caching.
0673: - Smaller generated pages where practical.
0674: 
0675: Target Google's good Core Web Vitals thresholds:
0676: 
0677: - LCP at or below 2.5 seconds.
0678: - INP at or below 200 milliseconds.
0679: - CLS at or below 0.1.
0680: 
0681: Measure through appropriate testing and field data where available.
0682: 
0683: Do not claim field performance thresholds were achieved using only a local simulated test.
0684: 
0685: ### Accessibility
0686: 
0687: Retain and improve WCAG 2.2 AA compatibility.
0688: 
0689: Verify:
0690: 
0691: - Keyboard-only navigation.
0692: - Screen readers.
0693: - Reduced motion.
0694: - High contrast.
0695: - Accessible headings.
0696: - Focus management.
0697: - Meaningful control labels.
0698: - Readable typography.
0699: - Zoom and text enlargement.
0700: - Touch-target sizing.
0701: - Colour contrast.
0702: - Accessible modals and dialogs.
0703: 
0704: **Completion condition:** New features work as a coherent extension of the existing website on phones, tablets, desktops and installed PWA environments.
0705: 
0706: ---
0707: 
0708: # 13. INCREMENT 10 — COMPLETE INTEGRATION AND RELEASE QUALITY ASSURANCE
0709: 
0710: This increment is mandatory before launch.
0711: 
0712: Integrate every completed feature into one release candidate.
0713: 
0714: Resolve all cross-feature conflicts.
0715: 
0716: ### Core regression tests
0717: 
0718: Run the repository's established build and test procedures, including the applicable equivalents of:
0719: 
0720: - Strict MkDocs build.
0721: - Generated site integrity audit.
0722: - Navigation tests.
0723: - Universal search tests.
0724: - Mobile search tests.
0725: - Panchang and festival calculation tests.
0726: - Ephemeris tests.
0727: - Translation tests.
0728: - Deity-art identity verification.
0729: - PWA and offline tests.
0730: - Accessibility tests.
0731: - Responsive layout tests.
0732: - Existing feedback and project-information tests.
0733: 
0734: Run additional tests for all newly implemented functionality.
0735: 
0736: ### Browser matrix
0737: 
0738: Test representative widths including:
0739: 
0740: - 320px.
0741: - 375px.
0742: - 768px.
0743: - 1024px.
0744: - 1440px.
0745: - Narrow desktop window.
0746: - Tablet landscape orientation.
0747: 
0748: Test both light and dark mode.
0749: 
0750: Test keyboard access, reduced motion and enlarged text.
0751: 
0752: Inspect screenshots and compare them against the baseline.
0753: 
0754: ### Special regression cases
0755: 
0756: Test:
0757: 
0758: 1. Multiple overlapping festivals.
0759: 2. Seven days before festival commencement.
0760: 3. Festival conclusion and return to original theme.
0761: 4. India timezone boundaries.
0762: 5. Unsupported or uncertain festival data.
0763: 6. Offline use after installation.
0764: 7. Offline-to-online recovery.
0765: 8. Old PWA cache upgrading to the new release.
0766: 9. Existing favourites and Japa progress preservation.
0767: 10. Guest use without sign-in.
0768: 11. Invalid or missing reader content.
0769: 12. Unavailable audio assets.
0770: 13. Disabled optional effects.
0771: 14. Mobile navigation while the keyboard is open.
0772: 15. Half-width desktop navigation.
0773: 16. Unicode search across different scripts.
0774: 17. Correct deity imagery and identity matching.
0775: 18. All relevant internal links.
0776: 19. Existing PDF and library links.
0777: 20. GitHub Pages deployment path compatibility.
0778: 
0779: ### Release-blocking defects
0780: 
0781: Do not release with:
0782: 
0783: - Missing primary navigation.
0784: - Broken search.
0785: - Broken catalogue pages.
0786: - Regressed Panchang calculations.
0787: - Incorrect sacred texts or deity assignments.
0788: - Lost user data.
0789: - Broken PWA installation.
0790: - Inaccessible core workflows.
0791: - Unsupported festival dates presented as verified.
0792: - Broken routes or canonical identifiers.
0793: - Unreviewed copyrighted assets.
0794: - Unintended changes to the authoritative collection.
0795: 
0796: **Completion condition:** One integrated release candidate passes all required functional, visual, accessibility and regression checks.
0797: 
0798: ---
0799: 
0800: # 14. ARCHITECTURE AND IMPLEMENTATION GUARDRAILS
0801: 
0802: Use the current MkDocs + Material architecture and existing generation pipeline as the baseline.
0803: 
0804: Do not migrate to React, Next.js, another static-site generator or a different backend without explicit approval and compelling technical justification.
0805: 
0806: Prefer progressive enhancement of existing components.
0807: 
0808: Follow `AGENTS.md` and repository conventions.
0809: 
0810: Do not edit the generated `site/` output as source.
0811: 
0812: Do not directly modify `data/collection.json` or the authoritative PDF.
0813: 
0814: Use existing data contracts, CSS variables, native navigation and established utilities where suitable.
0815: 
0816: Use new dependencies only when justified and compatible with GitHub Pages.
0817: 
0818: Do not introduce paid services, new authentication providers, external databases, tracking providers or subscriptions without explicit approval.
0819: 
0820: Never expose credentials or secrets.
0821: 
0822: Respect copyright, religious traditions, source attribution and verified identity mappings.
0823: 
0824: Preserve the existing Hindi, English and supported regional-language experience.
0825: 
0826: Do not silently equate transliteration with translation.
0827: 
0828: Do not use fabricated placeholder content in production as though it were real devotional material.
0829: 
0830: Ensure all new feature code is maintainable, documented and covered by appropriate tests.
0831: 
0832: ---
0833: 
0834: # 15. PARALLEL EXECUTION AND MEDIUM-MODE EFFICIENCY
0835: 
0836: The entire assignment must be compatible with a medium-reasoning coding-agent workflow.
0837: 
0838: Avoid repeatedly analysing the complete repository.
0839: 
0840: After the baseline audit, prepare a concise internal architecture map and persistent progress record.
0841: 
0842: Where the environment supports safe parallel execution, develop independent workstreams concurrently, such as:
0843: 
0844: - Visual system and responsive layouts.
0845: - Sacred Reader.
0846: - Festival theme engine.
0847: - Devotional journeys.
0848: - Search and discovery presentation.
0849: - SEO and social metadata.
0850: - PWA and performance improvements.
0851: - Automated tests and quality assurance.
0852: 
0853: Never allow concurrent tasks to modify the same file without coordination.
0854: 
0855: Use separate branches or worktrees where appropriate.
0856: 
0857: Serialise shared infrastructure changes and resolve dependencies before integration.
0858: 
0859: Do not sacrifice testing for speed.
0860: 
0861: Record completed work so that a context-window limit or interrupted session does not cause duplicate implementation or lost progress.
0862: 
0863: If a tool session ends, use the durable progress record and committed state to resume from the next unfinished increment.
0864: 
0865: Do not claim an unexecuted increment is complete.
0866: 
0867: ---
0868: 
0869: # 16. MANDATORY PROGRESS REPORTING
0870: 
0871: Maintain an implementation tracking document, such as:
0872: 
0873: `docs/development/HDC_TRANSFORMATION_PROGRESS.md`
0874: 
0875: For each increment, record:
0876: 
0877: - Increment number and objective.
0878: - Implementation status.
0879: - Files changed.
0880: - Relevant commit or branch.
0881: - Features completed.
0882: - Tests executed and results.
0883: - Screenshots or visual evidence.
0884: - Known limitations.
0885: - Dependencies or blockers.
0886: - Integration status.
0887: 
0888: Use clear states:
0889: 
0890: - NOT STARTED
0891: - IN PROGRESS
0892: - IMPLEMENTED
0893: - TESTED
0894: - INTEGRATED
0895: - BLOCKED
0896: 
0897: Do not use COMPLETED or TESTED unless the corresponding work actually occurred.
0898: 
0899: Update the record after every meaningful increment.
0900: 
0901: Continue executing the remaining work without asking the user to restate this master prompt.
0902: 
0903: ---
0904: 
0905: # 17. FINAL DELIVERY REQUIREMENTS
0906: 
0907: The deliverable is not merely a specification or a list of recommendations.
0908: 
0909: It must be a functioning, integrated HDC website upgrade in the existing repository, subject to the available coding environment and owner-controlled approvals.
0910: 
0911: Provide:
0912: 
0913: 1. A complete inventory of implemented features.
0914: 2. One final integrated release branch and reviewable pull request.
0915: 3. A concise record of incremental commits.
0916: 4. A full automated-test report.
0917: 5. Desktop, mobile and tablet visual comparisons.
0918: 6. Accessibility assessment.
0919: 7. Performance assessment with clearly labelled measurement limitations.
0920: 8. PWA and offline verification.
0921: 9. SEO and sharing verification.
0922: 10. A list of external permissions, assets or credentials still required.
0923: 11. A list of deferred features and honest reasons for deferral.
0924: 12. A rollback procedure.
0925: 13. Final launch checklist.
0926: 
0927: Do not label the whole assignment finished while mandatory increments remain incomplete.
0928: 
0929: If certain capabilities cannot be implemented safely, document that fact rather than pretending they work.
0930: 
0931: ---
0932: 
0933: # 18. SINGLE FINAL LAUNCH POLICY
0934: 
0935: The following sequence is binding:
0936: 
0937: **DEVELOP IN INCREMENTS → TEST EACH INCREMENT → INTEGRATE ALL INCREMENTS → TEST THE COMPLETE RELEASE → OWNER APPROVAL → ONE PUBLIC LAUNCH**
0938: 
0939: Do not deploy partial features.
0940: 
0941: Do not merge partially completed changes into the production branch.
0942: 
0943: Keep release-specific feature flags disabled for the public website until the coordinated launch.
0944: 
0945: Do not remove already approved functionality to simplify development.
0946: 
0947: Do not overwrite approved design assets.
0948: 
0949: Do not lose existing visitor preferences or saved data.
0950: 
0951: Do not alter the authoritative HDC database or PDF.
0952: 
0953: No feature should silently introduce a breaking change.
0954: 
0955: If the overall upgrade remains incomplete, preserve the functional development state and its progress record, but do not publish an incomplete release.
0956: 
0957: ---
0958: 
0959: # 19. FINAL SUCCESS DEFINITION
0960: 
0961: The transformation succeeds when:
0962: 
0963: - HDC retains its authentic Hindu devotional character.
0964: - The website looks visually refined and professional.
0965: - Visitors can immediately begin daily devotional activities.
0966: - Devotional reading is more engaging and useful.
0967: - Festival experiences feel culturally appropriate and immersive.
0968: - Search remains reliable and comprehensive.
0969: - Navigation is simpler across devices.
0970: - Personal devotional tools work cohesively.
0971: - The PWA feels like a polished application.
0972: - Search engines can effectively discover valuable content.
0973: - Social links produce recognisable branded previews.
0974: - All approved existing features remain functional.
0975: - No unsupported religious or historical claims are introduced.
0976: - No significant accessibility or performance regressions occur.
0977: - The entire upgrade is released as one verified, owner-approved package.
0978: 
0979: The guiding design principle is:
0980: 
0981: **“HDC should feel like entering a living digital sanctuary, while maintaining the reliability and scholarly discipline of a comprehensive devotional reference library.”**
0982: 
0983: ---
0984: 
0985: # 20. START EXECUTION NOW
0986: 
0987: Begin with the latest version of the existing GitHub repository.
0988: 
0989: First perform Increment 0 and establish the baseline.
0990: 
0991: Then proceed with Increments 1 through 10 under the rules above.
0992: 
0993: Execute independent tasks concurrently when genuinely safe and beneficial.
0994: 
0995: Do not stop at planning.
0996: 
0997: Do not stop merely because the first increment has been implemented.
0998: 
0999: Do not ask for routine approval between increments.
1000: 
1001: Implement, test, commit, record progress and continue.
1002: 
1003: Keep the public website unchanged throughout development.
1004: 
1005: When the complete integrated release passes final QA, present the final release pull request and supporting evidence for owner approval.
1006: 
1007: **One master assignment. Incremental implementation. One unified, coordinated launch.**
````
