# HDC transformation — durable release record

## Release policy

Owner assignment received 1 November 2026. Integration branch:
`release/hdc-transformation-20261101`. Production checkpoint:
`4bcd18cb4be6385ab5f06bf2e80d3b0d190a87e0` (PR #48 tablet/split-screen fixes).
No increment may be merged into main or deployed separately. Prior deployment
approval in this chat does not authorize this new release. Final owner approval
is required after all increments and final QA. No full-release PR is ready yet.

PR #49 was externally merged at `57d4346` while Daily Darshan was in development;
main is now `652b442`. The agent did not merge or deploy that checkpoint. Daily
Darshan commit `c06118e` is held in draft PR #50 and was NOT included in PR #49.
Do not merge PR #50 as an individual increment. Continue on the integration branch
and retain the single final-release approval gate.

PR #50 was subsequently merged externally; main advanced to `78f6153`. CI run
`41303376490` passed on `a8474f5`. The next Sanctuary/Reader increments are kept
separate and must not be individually launched. The agent did not merge/deploy
these checkpoints. Refresh main before creating the next draft PR.

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

## Increment 0 — baseline audit: TESTED (documented automation scope)

Implemented evidence runner: `scripts/capture_transformation_baseline.mjs`.
Public homepage captured in fresh profiles at 320, 375, 768, 1024 and 1440px.
All returned HTTP 200, no page JavaScript exceptions or horizontal overflow.
Evidence: `work/transformation/baseline/{width}.png` and `report.json` (local,
ignored output). Request failures are separately recorded, not silently ignored.
Baseline strict build passed in 87.20 seconds. Full local inventory found 2,265
routes, 39,708 bookmarks, 10,356 internal destinations and 8,305 external
destinations, with zero missing internal files/bookmarks. Public captures recorded
zero failed requests or HTTP error responses. Existing header geometry checks passed
at 320/390/768/1280/1440/1536px in light/dark, including full-to-split-screen
tablet transitions and drawer-resize recovery. Evidence: `work/header-fidelity`.
The 375px production screenshot was visually inspected; approved hero retained.
Physical screen readers, native app installation and real authenticated cloud
sessions have not been tested. Public browser capture is not a Core Web Vitals
field measurement or a full-site functional certification.

Confirmed improvement opportunity: shared metadata includes titles, descriptions,
canonical links and WebPage JSON-LD but lacks approved social-preview images.
No confirmed baseline runtime defect is asserted from inspection alone.

## Increment status

| Increment | State | Work / next evidence required |
| --- | --- | --- |
| 0 Audit | TESTED | Inventory, captures, strict build, responsive header checks; limitations below |
| 1 Design | NOT STARTED | Preserve tokens/artwork; measure representative page types |
| 2 Daily Darshan | TESTED | Initial neutral-discovery module; reviewed recommendations/reader continuation remain future work |
| 3 Sanctuary | TESTED | Initial optional digital aids; gated preview; physical audio not certified |
| 4 Sacred Reader | TESTED | One original Sanskrit passage; gated preview; translations/recordings unavailable |
| 5 Festivals | IN PROGRESS | Preview/scheduling foundation implemented; reviewed real observance data still unavailable |
| 6 Journeys | IN PROGRESS | Tested initial local routine/journal/log; broader routine/history features and offline preset handoff pending |
| 7 Discovery | IN PROGRESS | Tested canonical facets/paths; wider verified discovery data and navigation evaluation pending |
| 8 SEO/sharing | IN PROGRESS | Tested breadcrumbs, public sharing, metadata and unpublished editorial template; external SEO coverage unverified |
| 9 PWA/performance | NOT STARTED | Existing cache and install regression; measured limitations |
| 10 Integration QA | NOT STARTED | Complete matrix and owner-reviewed final release PR |

SEO files: `theme/main.html`, `scripts/test_social_metadata.py`.
Adds only the approved 512px brand icon to Open Graph and Twitter metadata,
using an absolute site-root URL for nested routes. No images, routes or data are
changed. Browser/social platforms ultimately control whether/when previews refresh.
New test checks generated HTML, canonical parity and JSON-LD. Release strict build
passed in 78.25 seconds; social metadata passed on all 2,266 HTML pages (including
404); site smoke checks passed on 16 routes and 43,085 canonical work IDs.
CI now includes the new metadata regression. This is the social-image subtask only,
not completion of all SEO/editorial/discovery requirements. No visual assets or
styles were modified. Baseline commit: `36b4691`.

Validation note: browser child-process launch required sandbox escalation (initial
EPERM); rerun passed. The initial new metadata test rejected the intentionally
repeated light/dark `theme-color` tags; uniqueness validation was correctly scoped
to social metadata rather than removing functional theme tags. No existing test
was weakened or removed.

## Recovery and continuation

### Next three initial slices — Journeys, Discovery, SEO/sharing

New default-OFF routes `journeys/` and `explore/`. Journey reuses the Japa count,
Reader progress and existing favourites links; it does not copy account records
or create a second counter. Optional journal/routine/self-reported log use
`hdc-journey-state-v1`, with explicit note-storage consent, plaintext/shared-device
warning, no cloud writes, no machine-translation/sharing of private form values,
bounded content/history and journal-only erase. Cross-tab notices retain unsaved
drafts. Query-based duration handoff is verified online; uncached offline preset
navigation remains for PWA QA. This is not a secure/encrypted vault.

Discovery populates real category/language/form selectors from the existing
integrity-checked search service and submits its normal GET contract. No ranking,
identity, alias, graph or canonical dataset changes. No unsupported regional or
family-deity classifications are invented. Existing mobile navigation is retained.

SEO/sharing adds preview-only actual category/group descriptions and canonical
BreadcrumbList, public-page native/copy/manual sharing (excluding private journey,
favourites and existing Reader control), and an unpublished source-review template
under `templates/`. No thin work pages, ratings, tracking or ranking promises.

Validation: default strict build passed 132.25s + disabled gate; preview strict
build passed 91.88s + enabled gate. New browser matrix passed ten width/theme
cases, private persistence/opt-in/erase, legacy Japa preservation, literal-text
injection safety, real search submission, keyboard focus, 4.5:1 contrast,
cross-tab draft protection, bad/blocked storage and public manual-copy fallback.
SEO structure audit passed 2,244 real breadcrumb hierarchies; social metadata
passed 2,273 pages; site smoke passed 16 routes/43,085 IDs. Existing numerical
search/ranking/coverage and all six browser search cases passed. Navigation passed
all eight widths, route/history/category/search and canonical pager cases.
Screenshots: `work/journey-discovery`; phone
dark-mode visual reviewed. Canonical collection hash unchanged. Full transformation
and final release QA remain incomplete. Details: `JOURNEYS_DISCOVERY_SEO.md`.

### Festival experience foundation

PR #51's Sanctuary/Reader checkpoint passed CI `41307084235` before this work.
New festival presentation uses the same default-OFF preview gate. Existing
astronomical/festival-rule engines are untouched. The 2026 registry is explicitly
empty: there is no reviewed year/region observance schedule to activate yet.
Original mode remains the honest automatic fallback, not guessed calendar dates.

Implemented: strict schedule schema and evidence fields, seven-calendar-day
eligibility in Asia/Kolkata, inclusive end, year/leap boundaries, regional scope,
deterministic overlap priority with other eligible links, midnight refresh,
original-theme override, labelled Ganesha/Shiva design previews, approved existing
portraits, optional reduced-motion-aware effects, no audio and private preferences.
Only the scoped preview panel changes; hero/header/canonical content remain intact.
Old requests/listeners/timers are aborted/cleared on navigation. Storage events
update tabs; blocked storage keeps a session-only setting. Year resources are
read locally and cached after successful validation; no external API is added.

Files and data-review procedure: `FESTIVAL_EXPERIENCES.md`. Tests:
`test_festival_themes.mjs` and `test_festival_browser.mjs`. All scheduling fixtures
are explicitly fictional, test-only and absent from production JSON. Unit tests
passed; default strict build and disabled gate passed (118.38s). Final preview
strict build passed (129.03s), with the enabled gate and all ten light/dark browser
cases at 320/375/768/1024/1440px. Synthetic automatic timing/expiry, cross-tab
preferences, malformed manifest, blocked storage and legacy Japa preservation
passed. Dark-mode visual QA corrected Material's default white/blue details panel
to the existing sacred palette. Locale-independent tie ordering and daily cache
refresh were added; midnight and visible-tab return refresh without polling.
Canonical collection hash remains unchanged. Screenshots: `work/festival-preview`.
Keep this increment IN PROGRESS until real reviewed
observance data and final release QA are supplied. Schema field validation is
not independent proof that a festival date is religiously correct.

### Sanctuary and Reader increments

New hand-authored routes: `sanctuary/` and `reader/`, reachable through existing
Tools navigation and Daily Darshan. `abp-practice.js` progressively enhances only
those roots; `practice.css` uses existing theme tokens. No new dependencies.

Both new features have a default-OFF build gate. Set `HDC_PRACTICE_PREVIEW=1`
only for staging/CI. Normal production builds omit their routes, navigation,
homepage links, script/style activation and offline shell entries. Existing
Daily Darshan and other approved features remain enabled. PR CI explicitly
enables the preview; the deployment workflow does not. Enabling these publicly
requires the final coordinated release/owner approval, not merely merging a draft.
`test_practice_release_gate.py disabled|enabled` verifies both generated artifacts.
Local preview: set that environment variable, then `uv run mkdocs build --strict`
and use the existing `/devotional/` preview server. Remove the variable to test
the default production artifact. Do not mistake disabled features for regressions.

Sanctuary: approved existing Ganesha image, virtual diya and flower interactions,
guided neutral reflection, optional 5/10/20-minute quiet sessions, motion toggle,
quiet mode and existing Japa link. Sound is off each mount; a synthesized tone is
generated only after explicit sound opt-in and bell selection. No copyrighted
ambient recording is included. Visual preference uses `hdc-sanctuary-v1`; running
sessions, flowers and sound permission are not persisted. AbortController cleanup
removes old handlers; page/document transitions close audio and stop timers.

Reader: one source-cross-checked original Sanskrit verse, Gita 2.47. Fixed source,
rights scope, institutional cross-reference and normalization are recorded in
`READER_PILOT_SOURCES.md` and shown alongside the passage. Original text excludes
machine translation. No modern translation/commentary/transliteration/audio is
bundled; these require separately reviewed sources/permissions. This initial
one-passage pilot is not a full scripture corpus or a critical edition.

Reader-local bookmark, explicit read/unread progress, continue link, font/spacing,
Unicode search, print view and passage-link sharing use `hdc-reader-v1`. No CWID
or catalogue record changes. Sharing uses explicit native share/copy with a manual
copy fallback. Storage failure leaves the text readable and controls session-only.
No automatic cloud sync, tracking or private journal is introduced. Existing user
stores are not erased or migrated. Both routes/CSS join the existing offline shell;
the original cache strategy is retained.

New `test_practice_browser.mjs` and CI screenshot artifact cover both themes and
five widths, interaction, opt-in audio (mocked), reduced motion, instant navigation,
reader persistence/search/print, exact Sanskrit, corrupt/blocked storage and
legacy Japa preservation. Final default strict build passed (69.97s) with the gate
disabled; final preview strict build passed (75.50s) with the gate enabled. Both
artifact gate checks passed. All ten width/theme browser cases passed with contrast
checks, the complete Sanskrit passage, no console exceptions, reader persistence,
storage failure and manual copy fallback. Real first-install service-worker testing
verified offline reader bookmarking and sanctuary diya interaction. Daily Darshan,
complete existing navigation, plugin/guest-state, real offline-homepage and
metadata/site checks also passed during integration. The final timer accessibility
adjustment passed the refreshed browser matrix. Countdown ticks are intentionally
not live-announced; start/end messages are announced. Phone and desktop visual
evidence is retained under `work/practice` and uploaded by PR CI. The canonical
collection SHA256 remains identical to the baseline. No production deployment.
Physical audio/installation certification and authored multilingual interface
translations are not claimed. Existing header and image designs remain unchanged.

### CI follow-up — run 41300442644

The strict build, metadata, search and earlier checks passed; the official-page
browser test failed at Disclaimer/1440px/dark footer keyboard focus. The initial
hash and visible heading are not a Material document-ready barrier: an in-flight
instant navigation can replace the footer between focusing it and checking Tab.
The unchanged test passed locally, confirming timing sensitivity. The test now
arms a next-document subscription before the hash click and waits for that
emission before testing focus. A delayed Material fetch exercises this path.
All four links' real keyboard-order, active-element, focus-visible, painted-ring
and target-size assertions remain unchanged. No production JS/CSS/data changes.
Revised browser test passed all six width/theme groups, including the delayed
fetch case. Strict build passed in 88.74 seconds; numerical suites passed 16/16
Panchang groups and 10/10 Ephemeris tests. Social metadata passed all 2,266 pages
after build completion (an earlier scan during output generation correctly
rejected the incomplete artifact). Replacement GitHub CI must still pass; local
results are not a claim that the remote run is green. Replacement run
`41301714026` on commit `57d4346` subsequently completed successfully.

### Daily Darshan increment

`hooks/royal_home.py` wraps the existing summary in a prominent, accessible
Daily Darshan section below the hero/statistics. `hooks/generate.py` relocates,
but never duplicates, the one summary instance. Date, shared location, festivals,
regional caveat and contextual discovery continue to use existing calculations.
Six guided links use existing routes, including the canonical deity category,
library, calendar, finder, favourites and Japa counter. No deity/day association,
full-text availability or editorial prayer recommendation is fabricated.
The required safe fallback is neutral discovery until reviewed selections exist.

`abp-daily.js` reads the existing `abp-japa-state-v1` without writing it or copying
private prayer names. A positive safe-integer count exposes the resume link;
missing, corrupt, invalid or blocked storage retains neutral paths. Storage events
update other tabs; Material document events and pageshow refresh current state.
No timer, account, audio, tracker or new storage namespace is introduced.
The existing PWA generator includes this script through its JS shell inventory.

Scoped `royal-home.css` rules reuse current theme tokens and responsive grid.
Approved hero/artwork/header and the canonical collection hash remain unchanged.
Tests: `test_daily_darshan_browser.mjs`, strengthened isolated homepage hook,
original royal homepage/header suites. CI includes the new matrix and screenshots
under `work/daily-darshan`. Final strict build passed in 110.67 seconds. All ten
320/375/768/1024/1440px light/dark cases passed, including 4.5:1 contrast for new
text, keyboard focus, touch sizes and destination checks. Invalid/blocked storage,
cross-tab update/clear and guest fallback passed. Original royal-homepage suite
passed all seven cases; final header geometry and tablet-resize checks passed.
Visual inspection corrected an uneven desktop grid and pale dark-mode text on
parchment; tests now protect that contrast. No pixel-identical full-page claim.
One local header run overlapped a build cleanup; that run was discarded, then
rerun against the stable final artifact. Do not run browser audits during rebuilds.
New prose is English and eligible for existing optional whole-page translation;
no claim of authored sacred translation or full dictionary expansion is made.

Resume from the first unfinished item above, inspecting git status before edits.
Keep partial commits on the integration branch. Full baseline evidence stays under
`work/transformation`; do not commit generated `site/` or authoritative PDFs.
Rollback development by returning to the production checkpoint on a separate clean
branch, not by hard-resetting or deleting user files. After eventual launch,
rollback only through a reviewed revert PR preserving user data and newer changes.

Release blockers: all NOT STARTED increments and final QA remain open. No complete
transformation, authoritative text pilot, verified festival schedule, performance
target attainment, or deployment is claimed.
