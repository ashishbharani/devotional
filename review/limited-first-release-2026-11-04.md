# Limited first release — owner authorization, 4 November 2026

## Limited first-release authorization — 4 November 2026

The owner explicitly selected **“Approve the limited first release; publish books separately”** after reviewing the tested private preview and the listed limitations. This approves the existing staging appearance/tested functionality, production activation and deployment of the current PR 51 features. It accepts partial translations and the unverified actual iOS/Android update/dismissal checks as documented follow-up limitations for this release; it does not certify those requirements as complete.

The whole Bhagavad Gita/Ramcharitmanas expansion is excluded from this first release and is being prepared on `feature/full-sacred-reader-20261104`. The current one-passage Reader remains for the first deployment. Native-authenticated cloud sync is not claimed. The ordinary source build remains default-OFF; only the approved production workflow explicitly supplies `HDC_PRACTICE_PREVIEW=1`, matching the tested preview configuration. Fresh CI, protected-branch requirements, a guarded merge and actual Pages verification are still required. No successful deployment is claimed by this authorization record.

## Evidence and review

- Existing PR source checkpoint: `7d79f659440e32ef2d6bda12a587c6446d93c542`; full configured CI [41698112272](https://github.com/ashishbharani/devotional/actions/runs/41698112272) passed. The new release configuration must pass its own CI before merge.
- The private preview implementation `fb74884a18358804fcf584662a81ad34f038aadd` has six owner-reported Windows Narrator/zoom passes and six Android task-group passes, recorded in `review/platform-observations-2026-11-04.md`. Attribution/limits remain intact.
- The PR's inline review thread was freshly inspected: its journey failed-write finding is resolved/outdated and covered by the shared local-state regression work. No unresolved inline thread was returned.
- The owner previously requested staging changes, then clarified full Gita/Ramcharitmanas addition, and subsequently chose to release the existing features first and books separately. The new book files are not part of this release branch.

## Release procedure and rollback

Verify the exact new head and all required checks, mark ready, merge with an expected-head guard and observe the real Pages run. Recheck public Reader/Sanctuary/Journeys/Explore, navigation/search, manifest/scope and worker paths. Preserve canonical data, user stores and provider settings. Record actual merge SHA/run/live observations after success; never infer them from approval. Roll back through a reviewed revert or restoration of the prior deployment configuration, without clearing user data. The main baseline before this release is `2153bec47fae545c72a581ff503a133d3db161d9`.
