# Sacred Reader expansion — 4 November 2026

## Owner request and release boundary

The owner requested the whole Bhagavad Gita and Ramcharitmanas in Sacred Reader, then explicitly approved a limited first release through PR 51 and a separate subsequent books release. This expansion is excluded from PR 51. Its own final build, regression checks and review must pass before the separately authorized merge/deployment. Partial translations and unavailable native-device checks remain documented limitations, not completed certification.

## Implementation

- Separate original-language text corpus, immutable source commits and full reuse licences. The corpus README/manifest document exact witnesses and transformations; no canonical collection data is edited.
- 18 Gita chapters, with 701 source entries because the chosen witness includes Arjuna's opening chapter-13 question. Seven Ramcharitmanas kāṇḍas, with 1,074 primary body units plus 13 opening invocation units. The second dataset supplies only the missing openings; its missing terminal units do not replace the complete primary endings.
- 65 bounded static reading pages. All text and reading-order links remain accessible without JavaScript. Original text carries language and no-translation protection. No unverified modern translation/commentary is copied.
- Existing Reader controls and theme reused; stable per-passage IDs, original 2.47 link/flags preserved, cross-page saved continuation/history links bounded to same-origin Reader routes, page-scoped clearing preserves other chapters, and Journey detects saved book progress.
- Source databases/attribution/licences downloadable with exact bytes and stable cross-platform hashes. Import is explicit maintenance work, never a live API dependency or network build step.
- Visited chapter HTML is cached for full and Material instant navigation; no unsolicited full-book download at install. Existing versioned-cache upgrade behavior remains. Original-language corpus is an electronic witness, not a critical edition or native translation review.

## Validation record

Initial source coverage passed. The first generated-artifact test exposed Windows text-mode newline conversion affecting download hashes; publishing source bytes and fixing corpus JSON/TXT checkout line endings corrects the cause, without relaxing byte-identity assertions. Initial browser selectors assumed raw relative hrefs; the existing site normalizes them, so tests now address link roles/resolved destinations. The original failed results are retained locally, not relabelled as passes.

The first completed strict preview build passed in 213.00 seconds. New Reader browser tests passed all six width/theme combinations (375/768/1440; light/dark), including terminal passages, legacy/independent progress, protected text, page-scoped clear and no overflow. Real-worker visited-book offline reuse, cross-page continue, unsafe saved-link rejection and no-JS original reading passed. These pre-final results do not replace the remaining final build/regression results.

The strict default-OFF build subsequently passed in 96.56 seconds, with both default release-gate checks and the 16-route/43,085-CWID site smoke check passing. The final preview rebuild passed in 125.84 seconds, and the final artifact test passed source-download byte identity, generated reading links, corpus coverage and enabled release gating. The combined existing regressions are running; no pending result is claimed as a pass. Earlier local diagnostics captured a 15-second wait inside Python's standard-library module file reads. The owner subsequently authorized this expansion as a separate release after PR 51; it must retain the final release's keyboard-focus repair and pass fresh CI before merging.

Exact final evidence must be added before publication. Prior owner-assisted tests concern `fb74884`, not the expanded book pages. Translation review, actual iOS and remaining native Android update/dismissal evidence remain unverified; the limited release authorization accepts them as follow-up limitations, not completed checks.

The first combined suite passed steps 1–10 (corpus/artifact, catalogue smoke, enabled gate, complete-book browser, existing practice/model/continuation/routines and all local-state tests). Step 11 correctly rejected a 7,375,462-byte first-install helper payload: Material had indexed all newly added book text. New book pages now use Material's existing `search.exclude` metadata, while the chapter hub remains searchable and per-page original-text search is retained. A regression checks both boundaries; the unchanged 4 MiB PWA budget must pass on the rebuilt artifact. No existing catalogue search record or algorithm is changed.
