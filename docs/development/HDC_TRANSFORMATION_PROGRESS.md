# HDC transformation — durable release record

## Release policy

Owner assignment received 1 November 2026. Integration branch:
`release/hdc-transformation-20261101`. Production checkpoint:
`4bcd18cb4be6385ab5f06bf2e80d3b0d190a87e0` (PR #48 tablet/split-screen fixes).
No increment may be merged into main or deployed separately. Prior deployment
approval in this chat does not authorize this new release. Final owner approval
is required after all increments and final QA. No full-release PR is ready yet.

## Architecture and preservation map

- MkDocs Material; `hooks/generate.py` generates catalogue routes and navigation
  from `data/collection.json`. Hand-authored docs override matching generated pages.
- `hooks/royal_home.py` supplies homepage presentation; `theme/main.html` and
  partials supply common metadata, header, menus, breadcrumbs and footer.
- Shared palette and accessibility layers: `abp.css`, `sacred-site.css`,
  `royal-home.css`, `hdc-header.css`. Preserve approved artwork; its source hash
  and crops are recorded in `docs/assets/images/hdc-brand/source.json`.
- Universal search and directory scripts preserve canonical IDs, aliases and
  identity-aware multilingual matching. Do not replace their ranking algorithm.
- Existing navigation has six compact destinations and adapts to available
  window geometry, including tablet split-screen. Preserve those fixes.
- Japa uses `abp-japa-state-v1`. Favourites use the existing guest database and
  optional Firebase synchronization. No new account provider is authorized.
- Panchang settings are the shared location store. Ephemeris, calendars and
  converter reuse existing engines. Device coordinates retain session privacy.
- Translation combines a local interface dictionary, script transliteration and
  optional external in-page machine translation; these are not sacred translations.
- Current reading links use external resources. They are not a verified first-party
  verse corpus. Pilot text needs documented provenance and redistribution rights.
- Festival rules explicitly mark regional review limitations and exclude unverified
  spans. Do not automatically promote these to verified year-specific rulings.
- Manifest scope/start URL `/devotional/`; `abp-pwa.js` handles explicit native
  install prompts/iOS guidance. Generator emits a versioned shell-only worker.
- CI `.github/workflows/check.yml` exercises strict build, data, search, astronomy,
  navigation, reader handoffs, languages, artwork, feedback, PWA and browser layouts.
  `deploy.yml` publishes on main push; never use it for partial release previews.

Protected collection SHA256 at baseline:
`1566bba3c5156fb2aa046b03080187cad70d745ade752f89aa601dcf4d80fd8d`.
Actual source currently contains 42 categories; do not invent an extra category
to match illustrative counts in specifications.

## Increment 0 — baseline audit: IN PROGRESS

Implemented evidence runner: `scripts/capture_transformation_baseline.mjs`.
Public homepage captured in fresh profiles at 320, 375, 768, 1024 and 1440px.
All returned HTTP 200, no page JavaScript exceptions or horizontal overflow.
Evidence: `work/transformation/baseline/{width}.png` and `report.json` (local,
ignored output). Request failures are separately recorded, not silently ignored.
Baseline strict build passed in 87.20 seconds. Full local route inventory and
light/dark responsive header checks are running; not yet marked TESTED.
Physical screen readers, native app installation and real authenticated cloud
sessions have not been tested. Public browser capture is not a Core Web Vitals
field measurement or a full-site functional certification.

Confirmed improvement opportunity: shared metadata includes titles, descriptions,
canonical links and WebPage JSON-LD but lacks approved social-preview images.
No confirmed baseline runtime defect is asserted from inspection alone.

## Increment status

| Increment | State | Work / next evidence required |
| --- | --- | --- |
| 0 Audit | IN PROGRESS | Collect inventory and light/dark screenshots; review requests |
| 1 Design | NOT STARTED | Preserve tokens/artwork; measure representative page types |
| 2 Daily Darshan | NOT STARTED | Reuse summary Panchang; verified or neutral discovery only |
| 3 Sanctuary | NOT STARTED | Optional digital aids; audio off and rights-gated |
| 4 Sacred Reader | NOT STARTED | Rights/source-verified pilot required; no invented translations |
| 5 Festivals | NOT STARTED | Reviewed year/region data and deterministic boundary tests |
| 6 Journeys | NOT STARTED | Extend existing local storage without invalidation |
| 7 Discovery | NOT STARTED | Preserve canonical matching and complete route access |
| 8 SEO/sharing | IN PROGRESS | Approved social image metadata plus full-site regression test |
| 9 PWA/performance | NOT STARTED | Existing cache and install regression; measured limitations |
| 10 Integration QA | NOT STARTED | Complete matrix and owner-reviewed final release PR |

SEO files: `theme/main.html`, `scripts/test_social_metadata.py`.
Adds only the approved 512px brand icon to Open Graph and Twitter metadata,
using an absolute site-root URL for nested routes. No images, routes or data are
changed. Browser/social platforms ultimately control whether/when previews refresh.
New test checks generated HTML, canonical parity and JSON-LD; build/test pending.

## Recovery and continuation

Resume from the first unfinished item above, inspecting git status before edits.
Keep partial commits on the integration branch. Full baseline evidence stays under
`work/transformation`; do not commit generated `site/` or authoritative PDFs.
Rollback development by returning to the production checkpoint on a separate clean
branch, not by hard-resetting or deleting user files. After eventual launch,
rollback only through a reviewed revert PR preserving user data and newer changes.

Release blockers: all NOT STARTED increments and final QA remain open. No complete
transformation, authoritative text pilot, verified festival schedule, performance
target attainment, or deployment is claimed.
