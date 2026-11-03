---
title: HDC Completion Execution
---

# HDC completion execution

The owner resumed implementation on **3 November 2026** with “complete it.” The [completion audit](HDC_MASTER_COMPLETION_DASHBOARD.md) remains the historical evidence baseline; the [finite R1–R9 and L1 roadmap](HDC_REMAINING_INCREMENT_PLAN.md) defines the remaining scope. This ledger records subsequent delivery without rewriting historical test results or claiming approval.

**Release boundary:** PR 51 stays draft. `HDC_PRACTICE_PREVIEW` stays default-OFF. No merge, activation or deployment is performed by this continuation. The complete final candidate still requires staging approval.

## R1 — Saved-data compatibility

Current state: implemented and covered by combined automated validation. The original 53-step local run at `6564cc5` executed all steps, with 51 passes and two failures: a localhost connection reset in search and an immediate assertion before Material's asynchronous search-focus update. The unchanged search test passed on rerun; the focus test now waits for the actual checked state while retaining its focus and viewport assertions. A subsequent 16/16 run at `20f87f8` and 18/18 run at `35c9941` passed, including both strict build modes and the reviewed festival slice. Earlier failed/interrupted reports remain intact; these results are not a claim of a 53/53 local pass on a later source.

- Reconciled production main `2153bec` in integration commit `5a836cb`. Preserve both the latest local translation loading/cache behavior and source/private `translate="no"` protections.
- Reuse the seven existing preview keys and formats; no migration, account-store duplication or key renaming.
- A small shared record guard preserves unfamiliar envelope and row fields, validates known fields, refuses malformed/future formats, and compares the saved snapshot before writes.
- Failed persistence keeps a visit-only draft. A subsequent external replacement/removal freezes that draft rather than overwriting the newer saved copy. A deliberate load of valid saved Journey changes replaces the draft; invalid saved changes do not.
- The guard survives same-document instant navigation. Its single storage listener also notices changes while the related page is detached. Full reload can lose unsaved visit-only changes, as disclosed; it never promises permanent storage when writes fail.
- Reader, Sanctuary, festival preferences, active Journey, routine library, Japa session history and section shortcuts share this behavior. Existing Japa counts, favourites, provider settings and astronomy remain separate and authoritative.
- The helper follows the existing preview activation and service-worker shell gates. It is omitted from the default production script list and offline shell.

Regression coverage: `test_local_state.mjs` tests the common record contract; `test_local_state_browser.mjs` exercises all seven actual consumer validators and the AF1/AF2/AF3 UI paths. Existing Reader continuation tests now explicitly require malformed records to survive unchanged, rather than expecting destructive recovery. Existing module, offline, navigation and translation checks remain required.

## R2–R4 and bounded R6 implementation

- **Reader:** source-cross-checked IAST accompanies the unchanged Sanskrit and Telang transcription. Passage IDs have independent bookmark/read flags; legacy scalar flags remain authoritative for the original `gita-2-47` link. A second isolated test passage proves the model without publishing invented sacred content. Explicit read marking adds bounded, private local history; sharing excludes query parameters. Actual missing/duplicate/invalid passage payloads and unavailable AudioContext have executable regressions.
- **Routines:** users explicitly search the existing canonical service and select up to ten actual work/passage IDs per routine. No new search algorithm, favourites store or identity is introduced. Selected works link to exact generated row anchors in their existing sections. Library and active completion remain separate; reference IDs are included only when the user explicitly records a completed session. Journal text is not copied to the library or source metadata.
- **Discovery:** all existing groups from five actual categories provide regional, tradition, festival, scripture and sacred-geography pathways. Four exact approved deity identities have portraits/cards; related identities hand off to the unchanged canonical finder. Two featured works retain exact CWIDs and original classification context. The actual link/source audit and subsequent combined QA pass; actual supported-platform acceptance remains open.
- **Navigation:** the [five-versus-six destination evaluation](HDC_MOBILE_NAVIGATION_DECISION.md) records why the owner's approved six tabs are retained. No navigation redesign is silently introduced.
- **Publication/SEO:** exact work anchors extend existing URLs; prior form/section anchors remain. The existing editorial template remains unpublished. The owner approved the public description and six topics on 3 November 2026. They were applied through GitHub API and independently read back; see the [acceptance record](HDC_FINAL_ACCEPTANCE.md).

## R5, R7–R9 and L1 boundaries

The owner approved the scoped 2027 reference civil-day proposal on 3 November 2026. One real reviewed record is now in the year manifest, with explicit reference-day wording and automatic preparation/expiry tests. The owner also confirmed that native-language reviewers and actual-device/assistive test resources are currently unavailable. Those gates remain open; no full translation, device verification or final staging approval is claimed. The [final acceptance checklist](HDC_FINAL_ACCEPTANCE.md) supplies concrete review tasks and rollback/launch steps without checking them off.

R8 has a finite CPU/network-throttled click/key experiment and tested Event Timing aggregation, but **does not pass acceptance**. The production-like comparison uses Chromium 151, 4× CPU, 150 ms latency, 1.6 Mbps download/750 Kbps upload, cold profiles, real font requests, disabled HTTP cache/worker and gzip text transport. Public Pages response headers confirmed gzip for the stylesheet and canonical index. The opt-in preview transport has exact-byte/decompression tests and leaves ordinary serving unchanged. Earlier uncompressed runs and failed probes are retained as diagnostics, not acceptance evidence.

| Pre-bundle candidate task | Width | LCP ms | Lab input candidate ms | Session-window CLS | Task |
| --- | --- | --- | --- | --- | --- |
| Home/header search | 375 | 9700 | 80 | 3.7796 | passed |
| Find | 375 | 4936 | 24 | 2.9537 | passed |
| Reader | 375 | 2464 | 56 | 2.0542 | passed |
| Journeys | 375 | 1376 | 48 | 2.0830 | passed |
| Home/header search | 1440 | 10716 | 152 | 3.0563 | passed |
| Find | 1440 | 2016 | 24 | 2.0881 | passed |
| Reader | 1440 | 3540 | 136 | 1.0068 | passed |
| Journeys | 1440 | 1612 | 160 | 1.9338 | passed |

Baseline `2153bec` under the same transport has home LCP 9520/11852 ms and CLS 3.8166/3.0466; Find LCP 1072/1908 ms and CLS 3.9514/2.0857 at 375/1440. Mobile baseline header search remains hidden; desktop and both Find tasks pass. The candidate's eight scripted tasks complete and observed input candidates meet 200 ms, but load/layout targets are missed. One sample per cell cannot establish zero regression or field INP. No real-device or field performance claim is made.

The candidate measurements identify built application source `35c9941` and exact script/worker hashes; `cea7811` adds history reconciliation without runtime changes. Reports retain failed requests and shift-source rectangles. A diagnostic caught partial stylesheet availability around large early shifts; an isolated explicit-render-blocking probe did not resolve them, so that speculative change was not adopted. Further loading/layout diagnosis or an explicit accepted limitation is still required. Approved art, CSS appearance and engines were not changed to game a score. Local reports: `work/performance-input/baseline-gzip-report.json`, `candidate-gzip-report.json`; neither has `allTargetsMet: true`.

A subsequent isolated CSS-delivery experiment retained all original CSS in its existing order and delivered it as one asset: mobile Reader measured LCP 1924 ms, lab input candidate 104 ms and CLS 0.0554. This identified a concrete loading-boundary repair. Preview builds now emit one content-hashed stylesheet with rebased local resource URLs, exact source-hash manifest and offline precache entry; original CSS files/URLs and the default-OFF production output remain intact. No colours, selectors, fonts or artwork are redesigned. Different/conditional cascades fail the build rather than being silently reordered; root-absolute 404 links preserve missing-nested-route behavior. The first strict preview attempt exposed that 404 case; its regression and corrected strict build pass. Representative performance, visual equivalence and combined regression acceptance must be repeated on this implementation before R8 is closed.

## Remaining completion boundaries

R2–R9 and adopted translation workstream L1 retain their audited DONE conditions. In particular, source preparation is not festival-review approval, Chromium emulation is not an actual Android/iOS install observation, authored translations are not native-language acceptance, and successful CI is not staging approval. None of those states is silently marked complete by this repair.

## Combined review-branch checkpoint

The remote branch received a concurrent merge of the same main baseline. Integration commit `cea78118d6da625c7a386eb15213b879792cc736` preserves both histories and the tested cache-versioning resolution, without a force push. [GitHub CI 41644869980](https://github.com/ashishbharani/devotional/actions/runs/41644869980) passed on that exact head, including the configured strict builds and regression suites. The protected-source hashes in both closing local reports were unchanged. PR 51 remains draft; no production deployment occurred.

Fresh preview captures on `cea7811` cover home, Reader, Journeys and Explore at 375/768/1440 pixels in both themes (24 combinations). All visible content images decoded; no page exceptions, unexpected first-party failures or horizontal overflow occurred. One aborted festival request was followed by a successful response and retained in the report. These Chromium screenshots preserve the approved shared artwork/theme and support review; they do not replace the owner’s final visual decision or actual-device observations.
