---
title: HDC Remaining Increment Plan
---

# HDC finite remaining increment plan

> Implementation resumed on 3 November 2026. See the [execution ledger](HDC_COMPLETION_EXECUTION.md) for changes after this audit snapshot. Historical counts below are not a claim that later code has passed acceptance. Preview remains default-OFF; deployment remains approval-gated.

[Master dashboard](HDC_MASTER_COMPLETION_DASHBOARD.md) · [Original requirement matrix](HDC_REQUIREMENTS_TRACEABILITY.md)

Snapshot: integration code `00e4502` incorporates main through `7e88e7a`; final production refresh is `2153bec` (PR 56), **3 November 2026**. This is the plan produced by the audit-only assignment. **No package below is authorized to be implemented during this audit; no merge, production activation or deployment is authorized.**

> **Coverage-count boundary:** language counts are the pre-audit `00e4502` generated-site snapshot. These maintenance documents add English hosted text under the existing MkDocs build; refresh coverage for the final documentation/source snapshot. The code-fenced original is documentary source, not a new instruction or authored translation. No audit exclusion was added to improve coverage numbers.

## Fixed counts and what they mean

- Original specification: **11 named stages (0–10)**. Audit closure ledger: **2 COMPLETE, 7 PARTIAL, 2 BLOCKED**. Daily's allowed neutral mode is functionally complete; Sanctuary has working core interactions but is not fully closed under cross-cutting safety/platform acceptance. These are not product percentages.
- Those **9 non-closed original stage groups** are reorganized below into **9 meaningful closure packages, R1–R9**. None is yet fully closed. This is not 9 commits,9 CI steps, or a newly invented9-feature promise.
- Minimum realistic planning lower bound: **8 pre-launch closure increments** only if R7/R8 can genuinely be combined into one supported-platform quality package. The fixed conservative plan is **9**, not an endless supply of micro-fixes. Changes to that count require a documented scope/dependency decision.
- **3 packages have direct external/manual completion gates today:** R5 real festival review, R7 actual device/assistive/visual observation, R9 owner staging/release decision. Others have source/rights/coverage decisions but can begin independent engineering/research; exact lead times are not promised.
- **L1** is one separately adopted whole-hosted-text translation workstream, excluded from original-M completion counts. It remains a current release dependency unless the owner explicitly changes that request. Its internal translation-batch count cannot be estimated until candidate classification and reviewer capacity are known; export tooling is not translation delivery.
- Thus the current conservative programme has **9 original-scope closure packages +1 adopted translation workstream**, then **one separately authorized launch/verification milestone H1**. Do not add these to 11 original stages as if they were comparable measures.

Estimates are rough active engineer/reviewer effort, not elapsed delivery promises. They derive from actual missing contracts (single-passage state, name/duration-only routines, empty festival registry, seven local stores, unmeasured input performance), existing reusable tests and identified review dependencies. Ambiguous coverage and external review time are explicitly uncertain. Work does not terminate merely because another commit or test passes.

## Immediately next action

The audit first establishes this scope and dashboard. **The next coding package, after this audit assignment ends, is R1: latest-main baseline reconciliation and all new-store data compatibility closure.** It closes a genuine original no-data-loss release condition. Do not first add another cosmetic feature, translation export format or isolated button fix. R2 source research, R5 evidence preparation and L1 language classification can run independently, using existing source IDs and no shared-file writes.

## Latest-main integration prerequisite

Main advanced to `2153bec` via merged/deployed PR 56 during the audit refresh. It adds selected-language local packs (482 Hindi source units, eight empty full-text packs), runtime loading/readiness, cache/version handling and publication-compatible prose tests. PR51 still has older main 7e88e7a and is reported unmergeable. Do not use old CI as combined proof.

**R1's first development subtask** is the reviewed baseline reconciliation, not a new feature increment: preserve both PR51 translate=no/notranslate protections and PR 56 language loading/offline/publication behavior, then rerun combined current-source tests. Shared files include abp-i18n.js, hooks/generate.py, hooks/sw.template.js and the relevant translation/prose/PWA tests. The present audit is documentation-only and does not perform that merge. R9 refreshes the baseline again before the final freeze.

## Seven-store compatibility boundary for R1

| Store | Current boundary / evidence | Required closure |
| --- | --- | --- |
| hdc-sanctuary-v1 | Effects-only preference; no full format/recovery matrix | Inventory known/unknown formats, failed persistence and external updates; maintain sound-off privacy. |
| hdc-reader-v1 | AF2 reproduced future-format/unknown record overwrite | Preserve source/version/unknown fields and legacy passage progress; migration only if explicit and tested. |
| hdc-festival-preferences-v1 | Mode/region/effects; no complete future/recovery matrix | Validate without silently downgrading future preference records or losing session-only intent. |
| hdc-journey-state-v1 | 00e active-Journey guards/regressions passed | Keep these protections as baseline; no regression during routine/Reader integration. |
| hdc-journey-routines-v1 | AF1 reproduced unknown-field loss and cross-tab future overwrite | Preserve envelope/row fields and prevent stale memory from replacing newer unsupported data. |
| hdc-japa-history-v1 | AF3 reproduced cross-tab future overwrite after failed write recovery | Retain visit-only data without overwriting another tab; preserve counter continuity and privacy. |
| hdc-section-shortcuts-v1 | Has own unsupported-data/external-change guards; tested favourites preservation | Retain behavior and test against the same combined recovery matrix; no duplicate favourites store. |

## Ordered closure packages

<a id="r 1"></a>
### R1 — Personal-data compatibility closure

| Field | Commitment |
| --- | --- |
| Priority / release state | P0; immediately next; coding can start after this audit stage ends; preview-only until final approval |
| Original requirement IDs | PRE-05/06/10; RDR-05; JRN-09; QA-06/09 |
| Exact intended functionality | Close AF1-AF3 and audit the seven preview stores as one compatibility deliverable. Preserve unknown fields/unsupported formats; failed writes followed by external changes must not overwrite newer saved state. Keep legacy Japa, guest favourites, CWIDs and provider settings authoritative. |
| Likely files/subsystems | abp-journeys.js; abp-practice.js; abp-japa-history.js; remaining preview-store modules and existing browser tests |
| Expected observable result | Existing records survive ordinary edits, blocked reads/writes, cross-tab changes and recovery; no new duplicated preference/account store. |
| Tests and objective acceptance | Reproduce each risk first; cover missing/valid/unknown/malformed/future records, permission/quota failures, cross-tab removal/replacement, recovery, navigation and offline update. Include routine-library envelope/row unknown fields, Reader state and Japa history combined recovery. |
| Dependencies / approvals | First reconcile latest main/PR 56 with existing protection and tests. Scope is every new store listed below, not every storage key on the internet. |
| Safe parallelism | Safe in a separate worktree; serialize shared practice/Reader/Journey runtime and generator changes with R2/R3. |
| Release/regression risks | High data risk; no cosmetic schema/key rename, reset or unreviewed migration. |
| Precise DONE | Latest-main reconciliation and applicable combined tests pass;all seven-store acceptance cases pass; AF1-AF3 closed with new regressions and existing records unchanged. |
| Evidence-based effort / uncertainty | 2-4 engineer-days; medium/high uncertainty from seven-store combined edge cases. |

<a id="r 2"></a>
### R2 — Complete the bounded verified Reader pilot

| Field | Commitment |
| --- | --- |
| Priority / release state | P1; original pilot completion, not a comprehensive scripture corpus; preview-only until final approval |
| Original requirement IDs | RDR-02/05/11/13; JRN-02; ARC-04 |
| Exact intended functionality | Provide a source/rights-verified transliteration and a genuinely extensible passage/content identity model. Keep original Sanskrit/Telang/source attribution and gita-2-47 permanent link. Demonstrate independent progress/search/continuation for a second passage using verified content or an isolated test fixture; do not invent a full-corpus obligation. |
| Likely files/subsystems | reader/index.md; abp-practice.js; Reader content/source records; existing reading/continuation tests |
| Expected observable result | Pilot supports transliteration and more than one independently tracked passage without changing canonical collection data. |
| Tests and objective acceptance | Exact wording/provenance/rights checks; actual missing/invalid passage payloads; Unicode, independent passage IDs/progress, legacy scalar-state compatibility, query/hash/print/share, no-JS and offline behavior. A fixture must never be presented as real public sacred text. |
| Dependencies / approvals | R1 state-safety contract; source/rights evidence. Resolve minimum useful pilot boundary without an arbitrary text quota. |
| Safe parallelism | Source research can run in parallel with R1/R5/L1. Serialize shared abp-practice.js and migration work. |
| Release/regression risks | Sacred-text accuracy, rights and old bookmarks. No machine translation represented as authoritative. |
| Precise DONE | Verified transliteration/source review is recorded; bounded multi-passage contract proven; all original applicable Reader controls and legacy link/state tests pass. |
| Evidence-based effort / uncertainty | 3-7 engineer-days plus source/meaning review lead time, not reliably schedulable until sources chosen. |

<a id="r 3"></a>
### R3 — Finish meaningful custom routines and reading continuity

| Field | Commitment |
| --- | --- |
| Priority / release state | P1; no reminders, rankings or ritual automation added silently; preview-only until final approval |
| Original requirement IDs | JRN-02/03/09/10; PRE-05 |
| Exact intended functionality | Define the smallest accepted custom prayer routine using user-selected existing devotional-work/passage references, beyond a name and timer. Reuse existing saved-work/Reader identities; add bounded continuation/history as needed. Retain current notes/logs and explicit local privacy controls. |
| Likely files/subsystems | journeys.md; abp-journeys.js; existing favourites handoff; Reader identity contract; routine/history tests |
| Expected observable result | A guest saves a real chosen prayer routine and resumes its works/readings; names/durations are not passed off as the whole builder. |
| Tests and objective acceptance | Two distinct real references can be saved/reopened in an isolated fixture; verify exact CWIDs/links, bounded list, independent progress, reload/back/offline, cross-tab and privacy/data-preservation cases. |
| Dependencies / approvals | R1; R2 passage model. Confirm minimal custom-routine semantics before expanding into advanced sequencing/reminders. |
| Safe parallelism | UI/content contract can be drafted while R2 source work proceeds; serialize shared storage and Journey files. |
| Release/regression risks | Private prayer information, duplicate favourites and schema compatibility. No automatic cloud journal sync. |
| Precise DONE | Accepted minimal routine contract is implemented, existing data survives, and meaningful resume/history tasks pass without creating an account. |
| Evidence-based effort / uncertainty | 3-6 engineer-days; high uncertainty until minimal routine contract is fixed. |

<a id="r 4"></a>
### R4 — Close verified discovery and navigation presentation

| Field | Commitment |
| --- | --- |
| Priority / release state | P1; no inferred family deity or invented regional metadata; preview-only until final approval |
| Original requirement IDs | DIS-01/02/06/10/12/13; SEO-07 |
| Exact intended functionality | Evaluate five destinations against approved six, recording the decision rather than replacing navigation automatically. Complete bounded deity/work card/related presentation and verified region/tradition/festival/scripture pathways. Unsupported Kuladevata or classifications must remain explicit rather than inferred. |
| Likely files/subsystems | explore.md; abp-discovery.js; existing finder presentation; navigation partials if evaluation justifies change; supplemental reviewed routing metadata |
| Expected observable result | Visitors discover supported material without knowing category taxonomy; supported dimensions have real paths and honest availability. |
| Tests and objective acceptance | Canonical ranking/alias/identity regression; real links/CWIDs, direct facets/empty states, query restoration/sharing/back, mobile touch/keyboard and distinct deity identities. |
| Dependencies / approvals | R1 for saved shortcuts; R5 reviewed festival discovery where applicable. Finite supported metadata/pathway inventory must be chosen; no frozen-data edits. |
| Safe parallelism | Independent metadata/navigation evaluation can run alongside R1-R3/R5/R6; coordinate shared header/finder files. |
| Release/regression risks | False relationships, taxonomy drift, broken links or ranking change. Additional unsupported mapping coverage requires explicit scope decision. |
| Precise DONE | All unconditional discovery dimensions have verified agreed pathways or explicit owner-accepted scoped resolution; conditional family-deity mappings may remain unavailable without invented data or a new approval obligation. Mobile-model evaluation and representative tasks pass. |
| Evidence-based effort / uncertainty | 3-7 engineer-days plus uncertain metadata/source review. |

<a id="r 5"></a>
### R5 — Deliver a real reviewed festival release slice

| Field | Commitment |
| --- | --- |
| Priority / release state | P0/P1; externally review-gated; engine-only tests are not acceptance; preview-only until final approval |
| Original requirement IDs | FES-02/03/07/08; QA-05 |
| Exact intended functionality | Fix a finite supported event/year/region/theme inventory first. Populate actual reviewed current/upcoming windows with source/reviewer/priority/region/tradition, then demonstrate real activation, expiry and overlaps. Existing Ganesha/Shiva designs are a starting slice, not a promise to cover every festival or optional global effect. |
| Likely files/subsystems | festival year/manifest data; themes.mjs; abp-festivals.js; partial/CSS only where accepted presentation requires; review/festivals evidence |
| Expected observable result | Automatic mode uses real approved upcoming records, honors seven-day India timing/region and returns to original; manual preview remains labelled. |
| Tests and objective acceptance | Synthetic boundaries plus actual reviewed data end-to-end; adjacent-year coverage where relevant, exact region/tradition, original override, overlaps, missing schedule, no audio/effect regression and no astronomy changes. |
| Dependencies / approvals | A real maintainer/source reviewer and accepted finite coverage/presentation scope. Current sole candidate is past 2026-09-14 and cannot prove upcoming behavior. |
| Safe parallelism | Source/evidence preparation independent of Reader/discovery. Serialize manifest/theme/runtime edits and real-data test guard changes. |
| Release/regression risks | Wrong religious date, false universal scope, conflating civil day with ritual/tithi/conclusion. Never promote fixtures or guessed annual dates. |
| Precise DONE | Finite supported inventory approved; upcoming real reviewed records in manifest; real timing/expiry/region test evidence and accepted visual slice recorded. |
| Evidence-based effort / uncertainty | 2-5 engineer-days after coverage/source decisions; external review lead time NOT DETERMINABLE. |

<a id="r 6"></a>
### R6 — Finish bounded SEO, landing and publication foundations

| Field | Commitment |
| --- | --- |
| Priority / release state | P1; template already exists, not a requirement to publish six invented articles; preview-only until final approval |
| Original requirement IDs | SEO-04/05/07/09/11/14; DEL-03 |
| Exact intended functionality | Choose important real deity/work/content destinations, validate canonical/duplication/metadata/internal links and applicable share types, verify maintenance template usability, and prepare accurate repo description/topics for owner approval. No invented article quota or mass thin work pages. |
| Likely files/subsystems | theme metadata/breadcrumbs; selected actual landing pages; editorial template/docs; existing metadata/link tests; public repo settings only with approval |
| Expected observable result | Supported landing/share types carry accurate source/context; approved public repository description/topics; future articles can use the template without app changes. |
| Tests and objective acceptance | Generated URL/canonical/sitemap/robots/JSON-LD/alt audit, link/share fallbacks, representative external card rendering where available, private exclusion, no fake ratings/FAQ and no duplicate identity pages. |
| Dependencies / approvals | Reader/festival/discovery supported content inventories; owner branding approval before repo setting mutation. Search-console/index/analytics access remains conditional. |
| Safe parallelism | Metadata/template review can run alongside R1-R5/L1; serialize theme/main.html and selected source-page changes. |
| Release/regression risks | Misleading snippets, duplicated thin pages, private notes in metadata or unsupported ranking promises. |
| Precise DONE | Agreed real landing/share inventory is validated, repo wording/topics approved/configured or explicit owner-approved deferral, template is maintainable; unavailable external-service evidence disclosed. |
| Evidence-based effort / uncertainty | 2-4 engineer-days plus owner/external-service availability; no SEO-traffic guarantee. |

<a id="r 7"></a>
### R7 — Supported-device visual, accessibility and installed-PWA acceptance

| Field | Commitment |
| --- | --- |
| Priority / release state | P0/P2; external/manual participation currently missing; preview-only until final approval |
| Original requirement IDs | DES-01–06; SAN interaction quality; ACC-01/03/04/06–08; PWA-01/03/04/05/10; QA-03/04 |
| Exact intended functionality | Agree finite supported browsers/devices and review actual guest tasks with screen reader/keyboard/real zoom, safe areas/orientation, installed Android/Chromium and iOS/Safari guidance, both themes, reduced motion and all relevant control states. Compare final representative pages with approved baseline/board. Fix only observed defects. |
| Likely files/subsystems | Shared header/navigation/styles and existing controls only where a confirmed defect exists; screenshot/review dossier and browser tests |
| Expected observable result | Observed readable/coherent supported-platform experience, with actual native/browser/assistive results separated from mocks. |
| Tests and objective acceptance | Manual task observations plus automated regressions, including unavailable AudioContext/silent fallback; actual install accepted/dismissed/unsupported/installed behavior, focus/dialog return, contrast on art/gradients/state, keyboard opening, split-screen, zoom, safe areas. |
| Dependencies / approvals | Stable R1-R6 feature slices and access to agreed actual devices/assistive tools/owner visual reviewer. Chromium UA mocks cannot close iOS support. |
| Safe parallelism | Review plan and baseline comparison can start early. Final observations must repeat on frozen candidate; serialize confirmed shared CSS/header repairs. |
| Release/regression risks | Unnecessary redesign or claiming certification from screenshots/mocks. No demand for universal-device coverage or external certification invented. |
| Precise DONE | All agreed actual supported-platform tasks observed/passed or explicit accepted limitations; owner visual decision records exact screenshots/artifact. |
| Evidence-based effort / uncertainty | 2-5 engineer/tester-days plus device/owner availability; not a certification timetable. |

<a id="r 8"></a>
### R8 — Measure and close realistic performance/input quality

| Field | Commitment |
| --- | --- |
| Priority / release state | P2; no new analytics provider or mandatory field-certification project; preview-only until final approval |
| Original requirement IDs | PER-01–04/06; PWA efficiency; QA regression |
| Exact intended functionality | Measure representative page loads and actual input interactions under a documented supported load/device/network plan, including INP. Investigate variability and remediate only confirmed issues; preserve approved design. Reuse images/deferred modules/pagination/cache budgets appropriately. |
| Likely files/subsystems | Existing loading/rendering boundaries, performance runner/lab reports, image scheduling and worker only if measured necessary |
| Expected observable result | LCP/INP/CLS and supported-task cost have credible evidence, beyond a short unthrottled font-stubbed snapshot. |
| Tests and objective acceptance | Measure LCP<=2.5 s, INP<=200 ms, CLS<=0.1 as targets under agreed conditions; compare baseline/release, budgets and low-end practical tasks. Use field data where available, never fake it. |
| Dependencies / approvals | Stable feature code and agreed measurement plan. No paid analytics or field dataset is an automatic prerequisite. |
| Safe parallelism | Independent profiling can run with source/editorial work; final comparisons after relevant runtime fixes. Shared runtime/cache changes serialized. |
| Release/regression risks | Speculative visual redesign, misleading metrics or blanket zero-regression claims. Historical 1.97 shift is not proven current defect. |
| Precise DONE | Credible load+input evidence for all three targets; confirmed regressions fixed or explicit owner-accepted supported limitation; method/data scope recorded. |
| Evidence-based effort / uncertainty | 2-5 engineer-days; variability and target environment produce high uncertainty. |

<a id="r 9"></a>
### R9 — Frozen complete candidate, final dossier and owner staging decision

| Field | Commitment |
| --- | --- |
| Priority / release state | P0; final verification/approval, not deployment; preview-only until final approval |
| Original requirement IDs | GOV-05/06; QA-01/09/10; DEL-01–06/08/09 |
| Exact intended functionality | Integrate all accepted original deliverables and adopted L1 resolution, freeze source plus deployment configuration, run all applicable tests, review findings/rights/real data/visuals, package artifact and rollback/launch checklist, then obtain explicit owner staging/release decision. Do not merge merely because CI is green. |
| Likely files/subsystems | Integration branch/docs/workflow configuration plan, complete checks and staged artifact; no production action before authorization |
| Expected observable result | One intelligible final release package with traceability gaps closed and exact-code/artifact approval. |
| Tests and objective acceptance | Whole final matrix, not a past 45 run or seven selected checks; reproducible hashes/build, all links/bookmarks/source/rights/private data, real festival slice, accepted device/performance dossier, clean diff, rollback rehearsal and fresh review. |
| Dependencies / approvals | R1-R8; L1 separate adopted language work; owner availability. No unreviewed feature or data activation. |
| Safe parallelism | Prepare checklist/dossier structure early; final acceptance is serialized on one frozen candidate. |
| Release/regression risks | Mixing source heads, wrong preview/production config, stale worker, unresolved private-data risk or treating approval as deployment. |
| Precise DONE | No original mandatory gap or unaccepted scope ambiguity; all adopted gates met; exact candidate reviewed, rollback/enablement plan ready, explicit owner decision recorded. |
| Evidence-based effort / uncertainty | 1-3 engineer/release-days after dependencies; owner decision lead time unknown. |

## Separate adopted workstream L1 — hosted-text translation completion

**Source:** earlier owner language request and [merged PR 54](https://github.com/ashishbharani/devotional/pull/54); original M still separately requires source/private protection and preservation of supported languages. L1 is not a blank-cheque new requirement to translate sacred sources through an interface dictionary.

- **Deliverable:** classify the13,696 current audit candidates, separate brands/proper names/canonical titles/fragments from real prose, author applicable English-plus-nine-language hosted/runtime UI content, record native meaning/source review and preserve protected source/private fields. Counts change with source; use fingerprints/IDs, not a fixed quota.
- **Files:** existing i18n catalogues/runtime and reviewed text sources, not frozen canonical collection or an embedded private provider key. Reuse the existing review export; no new export iteration is needed merely to show activity.
- **DONE:** applicable hosted/runtime text inventory resolved and completeness checks pass with documented legitimate exclusions; native meaning reviewed; no transliteration-as-translation or private/sacred-source overwrite; site functionality/design unchanged.
- **Dependencies:** native-language reviewer capacity, source/rights where needed, stable source snapshot. PR54/56 records specify sequential translation authoring without agents; respect that within L1. Classification/authoring may proceed alongside independent non-language R1-R8 work with separate file ownership; runtime/catalogue changes must be coordinated and audited. PR 56 is already merged/deployed but explicitly partial; integrate that verified checkpoint without treating it as full coverage or assuming any later uncommitted work is included.
- **Effort:** **NOT DETERMINABLE** before classification and capacity review.13,696 are candidates, not 13,696 necessarily distinct prose passages; nine target languages multiply real work. An invented days-per-string schedule would be misleading.
- **Gate:** retained for the current requested release unless the owner explicitly revises it. A narrower original-M release cannot silently discard this independently adopted requirement.

## P0/P1/P2/P3 unfinished-work register

Each row refers to the complete package above for tests, dependency, parallelism, effort and DONE. This is the complete register of discovered outstanding work at this snapshot; a new finding must reference an existing requirement or be separately proposed as optional. Do not create unbounded extra increments.

| Priority / item | Exact remaining deliverable | Why unfinished | Required review / concurrency / estimate |
| --- | --- | --- | --- |
| P0-A: R1 | Seven-store compatibility and AF1-AF3 closure | Existing green tests missed combined recovery and unknown-field cases | Automated reproduction/fix/regression; can run independently of source review;2-4days rough. |
| P0-B: R5 source gate | Finite real current/upcoming festival inventory and reviewed timing/region/presentation | Real schedule empty; only unreviewed past candidate | Real reviewer/date/source/scope; evidence preparation parallel;2-5 eng-days after decisions, lead time unknown. |
| P0-C: R7/R8 quality | Actual supported-device/assistive/zoom/install observations and realistic load/input evidence | Chromium/mocks/local lab samples are bounded | Manual/devices/owner visual plus appropriate measurements; parallel preparation, final artifact serial; estimates in packages. |
| P0-D: R9 | Complete frozen candidate, dossier, rollback/enablement/checklist and explicit staging decision | Product/source/quality gaps remain; no final approval | Final owner decision/exact-head checks; waits all dependencies;1-3active days plus unknown review wait. |
| P0-E: L1 adopted scope | Applicable translated hosted/runtime text and meaning review | Blank export is not authored/reviewed translation | Native-language review; parallel source batches only after classification; effort unknown. |
| P1-A: R2 | Transliteration plus extensible verified Reader pilot | Single hard-coded passage/scalar state; no verified transliteration | Source/rights and bounded pilot acceptance; parallel research;3-7days plus review. |
| P1-B: R3 | Real custom prayer routines and reading history | Names/durations and one passage flag do not fulfill full routine/history promise | Minimal contract/source identity/privacy; follows R1/R2;3-6days. |
| P1-C: R4 | Mobile-model evaluation, verified discovery dimensions/cards/related presentation | Canonical facets/links exist, region/tradition/festival paths incomplete | Finite verified mapping/unsupported-scope decision; parallel metadata work;3-7days plus source review. |
| P1-D: R6 | Supported important landing/share/public repository/editorial foundations | Template/head metadata exist; description/topics empty and landing/coverage choices absent | Owner branding and source/preview checks; parallel;2-4days plus availability. |
| P2-A: R7 | Visual/interaction/contrast/zoom refinement driven only by observed defects | Automation is not complete human/browser-state acceptance | Review agreed pages/states; preserve approved design; no speculative redesign. |
| P2-B: R8 | Load/deferred/image/page-size and INP/LCP/CLS measured refinement | One-second unthrottled samples omit INP and realistic network/device work | Measure first, fix confirmed problems; field data only where available. |
| P3: optional expansions | Full scripture corpus, licensed ambient/streaming recordings, extra festival effects/themes, analytics/new providers, advanced automation | Not unconditional original promises; some were explicitly conditional | Separate authorization/rights/scope; excluded from mandatory completion counts. No implementation during audit. |

## Dependency and concurrency plan

1. **First closure:** R1. In parallel, prepare R2 source/transliteration evidence, R5 real festival evidence, R6 metadata inventory and L1 classification. Preparation is not source approval.
2. **Content/personal workflows:** after R1 establishes safe state contracts, implement R2 then R3. R4 verified pathways can proceed with real source metadata; festival-specific links depend on R5. Do not concurrently edit abp-practice.js, abp-journeys.js, theme/main.html or hooks/generate.py without file ownership/serialization.
3. **Quality:** prepare R7 device/assistive/visual matrix and R8 measurement plan early. Repeat actual acceptance after relevant final feature changes. Performance/visual observations must identify exact artifact and settings.
4. **Final:** R9 only after mandatory original and adopted scope is complete or the owner explicitly accepts documented scoped limitations. Complete exact-head checks and staging review; never infer readiness from historical CI or aggregate test counts.

## H1 — separately authorized final launch and live verification

H1 is **not authorized during this audit** and is not an extra product feature. After explicit owner approval of R9's exact candidate:

1. Create a release checkpoint and verify the approved feature-enablement/deployment configuration. Current ordinary deploy omits the preview flag; merging as-is would leave the new interfaces hidden. Default-OFF remains mandatory for unapproved builds.
2. Build and verify the approved production artifact, all /devotional/ paths, manifest/icons/worker, source hashes, private exclusions and rollback procedure.
3. Merge/deploy through the existing workflow only under that authorization. Do not bypass failed checks, conflicts or branch protection.
4. Verify live navigation/search/Panchang/Reader/Journey/PWA content/worker updates against the approved version. Observe supported account/device paths where available; do not claim unperformed sign-in/native install tests.
5. Record live version and limitations. Roll back only through a reviewed, data-preserving revert/configuration procedure if required; never clear user stores to solve branding/cache issues.

## Termination rule and change control

The original transformation terminates when every mandatory M criterion in the matrix is met or the owner explicitly resolves a bounded conditional/ambiguous scope, all applicable quality/rights/data-preservation checks pass on one frozen artifact, final owner approval is recorded, and the one authorized coordinated launch is live-verified. For the currently requested release, L1 also needs its own accepted resolution.

No article quota, whole-corpus requirement, every-festival catalogue, mandatory paid tracking or unavailable field-certification project may be added to move the finish line. Newly discovered defects map into R1-R9 and their original criteria; any genuinely new product feature is P3 and excluded until separately authorized. If agreed source/coverage changes make nine packages untenable, record the changed requirement, reason, impact and owner decision before altering this roadmap. **Do not implement R1 or anything else as part of this audit assignment.**
