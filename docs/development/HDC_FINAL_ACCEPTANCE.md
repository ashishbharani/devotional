---
title: HDC Final Acceptance and Launch Checklist
---

# Final acceptance and launch checklist

## Limited first-release authorization — 4 November 2026

The owner explicitly selected **“Approve the limited first release; publish books separately”** after reviewing the tested private preview and the listed limitations. This approves the existing staging appearance/tested functionality, production activation and deployment of the current PR 51 features. It accepts partial translations and the unverified actual iOS/Android update/dismissal checks as documented follow-up limitations for this release; it does not certify those requirements as complete.

The whole Bhagavad Gita/Ramcharitmanas expansion is excluded from this first release and is being prepared on `feature/full-sacred-reader-20261104`. The current one-passage Reader remains for the first deployment. Native-authenticated cloud sync is not claimed. The ordinary source build remains default-OFF; only the approved production workflow explicitly supplies `HDC_PRACTICE_PREVIEW=1`, matching the tested preview configuration. Fresh CI, protected-branch requirements, a guarded merge and actual Pages verification are still required. No successful deployment is claimed by this authorization record.

This is the operational review checklist for the finite [completion roadmap](HDC_REMAINING_INCREMENT_PLAN.md), prepared on 3 November 2026. It is not a declaration of full-scope completion. The bounded first-release authorization above supersedes the earlier no-deployment boundary only for its stated scope. The [execution ledger](HDC_COMPLETION_EXECUTION.md) records implemented/tested work separately.

## Content and public identity decisions

- R5 has a concrete upcoming Maha Shivaratri 2027 candidate in `review/festivals/2027-candidates.json`. The owner explicitly approved the exact one-reference-civil-day, India, priority-10 proposal on 3 November 2026; the approval is recorded without claiming an external scholar or GitHub review. The record is promoted to the 2027 registry. Real timing/wording tests pass; other unreviewed records stay ineligible.
- R6's bounded landing inventory is Ganesha, Shiva/Mahesh, Vishnu and Hanuman category sections; Hanuman Chalisa record `HDL2-CWID-25F980F2BD34A2107382`; and the Sri Vaishnava Vishnu Sahasranama record `HDL2-CWID-E73C30069833764A47B2`. The work destinations are exact row anchors in their existing sections. Other same-title records remain separate. No thin duplicate work pages, fabricated ratings or individual-work Open Graph claims are created: external crawlers see the accurate existing section metadata.
- The existing unpublished `templates/editorial-article.md` supplies scope, tradition, source, rights, review, canonical discovery and correction sections. It remains outside `docs/`; no unreviewed article or arbitrary article quota is published.
- Repository description explicitly approved by the owner and applied/read back through GitHub API on 3 November 2026: **HDC — Hindu Devotional Collection: searchable devotional catalogue, scripture and book references, Panchang and Indian Ephemeris.** Approved and verified topics: `hinduism`, `devotional-library`, `mkdocs-material`, `panchang`, `ephemeris`, `github-pages`. The exact approved description and six topics were verified after application; the previous public values were retained in the local maintenance evidence. No website deployment was performed. No ranking or traffic promise is made.
- L1 still requires authored applicable hosted/runtime translations and meaning review across the nine target languages. The deployed partial Hindi pack is preserved. Empty packs, interface-key coverage and a successful export do not establish complete translation. No new external translator is introduced.

## Finite supported-platform observation plan

**4 November observation update:** on candidate `fb74884a18358804fcf584662a81ad34f038aadd`, the owner reports all six Windows Narrator/zoom tasks passing, plus six Android task groups: homepage, native install prompt, standalone launch with install controls hidden, offline Reader/bookmark retention, portrait/landscape navigation/search/history/Library links, and full Meerut preset synchronization across Panchang/calendar/Ephemeris after reload. Exact task outcomes and evidence limitations are recorded in `review/platform-observations-2026-11-04.md` in the repository. These are actual owner-assisted reports, not independently captured speech or phone telemetry. Android update/dismissal and actual iOS observations remain open. A separate owner-private HTTPS test site is published; GitHub Pages production is unchanged. Final approval and L1 remain open.

| Observation | Automated evidence | Actual observation still required |
| --- | --- | --- |
| Windows Chromium, 320–1440 widths, light/dark, reduced motion | Existing header, keyboard, navigation, practice and design-system suites | Exact final screenshot comparison with approved design; real zoom and focus/dialog task review |
| Android Chrome, installed and ordinary browser | Touch-sized viewport, worker and mocked prompt tests | Physical device: accepted/dismissed install, app launch, orientation/safe area, bottom navigation and offline/update tasks |
| iPhone/iPad Safari | Browser guidance and user-agent mocks | Actual Safari: Add to Home Screen instructions, standalone launch and safe-area behavior |
| Desktop screen reader | Accessible names/states and keyboard browser assertions | Actual assistive-technology task observation, including headings, status announcements, dialogs and focus return |
| Source/private boundaries | Translation protection, no-JS/offline Reader, no-audio fallback and data tests | Source/meaning and privacy wording review; no authenticated account/cloud-sync claim without real authorized execution |

Proposed acceptance tasks: navigate all six primary destinations and their actual menus; find a known work and a documented related identity; use Library/READ links; set one canonical city and verify Panchang/calendar/Ephemeris agree; bookmark/read/share the pilot; reopen a selected-work routine; record/cancel Japa without resetting the counter; test quiet mode; install where supported; reload/update/offline and use browser history. The proposal is finite; it is not an invented external certification requirement. Record exact device/browser/assistive version, source commit, artifact hash, settings, task, outcome and any accepted limitation.

R8's `scripts/measure_interaction_performance.mjs` measures actual scripted click/key Event Timing and LCP/CLS with documented CPU/network throttling and real font requests. Its finite lab INP candidate is explicitly distinguished from field INP; failures and missing native measurements remain visible. Repeat on the frozen candidate, with no competing browser/build jobs, and compare the relevant baseline under the same conditions. Do not call a localhost pass physical-device or field validation.

## Final candidate freeze — R9

1. Reconcile fresh main safely; inspect the entire diff and all PR review threads. Preserve both language-cache behavior and source/private protections. Do not bypass conflicts, failed checks or branch protection.
2. Resolve original mandatory gaps and L1, or obtain explicit scoped decisions. Record actual source/rights, festival, supported-platform, performance and visual evidence; never replace missing review with a checkbox.
3. Freeze source commit and build configuration. Record `git status`, exact commit SHA, lockfiles, protected-source hashes, generated artifact SHA-256 and whether preview is enabled. Use one artifact for the approval screenshots and dossier.
4. Run the complete current release validation runner, the strict default-OFF and preview builds, and all applicable CI checks on that source. Keep old failed/interrupted reports as historical evidence; a past result does not validate a newer commit. Review translation coverage without treating candidate counts as translated prose.
5. Verify all featured/category/work/Reader links, source wording, private-page metadata exclusions, saved-state compatibility, manifest/icons/scope, actual worker offline/update behavior and default-OFF exclusion. Record unsupported provider/device operations honestly.
6. Provide the owner with the exact candidate, screenshots and unresolved/accepted limitations. Obtain explicit staging/release approval before any merge, production activation or deployment. Current PR remains draft until this gate is satisfied.

## Authorized launch only — H1

1. Recheck fresh PR head and checks against the approved SHA. Create a recoverable release reference. Confirm the approved production feature configuration: an ordinary build currently leaves practice preview off, so merging alone is not activation.
2. Build the approved production artifact; verify `/devotional/` start URL, scope, manifest/icon/worker paths and cached-shell boundaries. Retain the artifact/hash and deployment configuration for recovery.
3. Merge with an expected-head guard through the existing protected workflow only after explicit approval. Observe the actual Pages build/deployment result.
4. In a fresh browser verify live source version, assets, search/category/Library navigation, tools, shared location, Reader/routines if activated, PWA update/offline behavior and default privacy controls. Do not claim a sign-in, physical install or cloud synchronization that was not executed.
5. Record live commit/run/URL, approved configuration and observed limitations. If a material regression requires rollback, use a reviewed revert or the previously approved default-OFF configuration. Keep user records intact; never erase localStorage, favourites or account data as a rollback shortcut. Verify recovery and worker update paths rather than forcing a broad origin-cache clear.
