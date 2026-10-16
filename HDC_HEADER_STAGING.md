# Approved HDC header / navigation / PWA staging

## Approval gate and recovery

No merge or production deployment is authorized until the owner approves the
complete staging build. Baseline: `f290e1ddd280f79c70c5ea7b441ed97536d88b87`,
local branch `checkpoint/approved-header-baseline-2026-10-16`.
The earlier, unfinished in-page translation integration is separately preserved
at `0dec9f0` / `checkpoint/in-page-translation-2026-10-16`; do not silently publish
that unfinished checkpoint or lose it while working on the header.

Rollback: before merge, close the staging PR and return to the baseline branch.
After an approved release, revert the eventual merged/squashed **header PR** through
a new PR and rebuild, not the upstream-main integration checkpoint. Never clear
user storage, discard later upstream changes or reset canonical data to roll back.

## Audited architecture and preservation boundary

- `hooks/generate.py` builds the catalogue, native routes and `config.nav`.
  Its actual source has **42 categories**, 2,112 groups and 43,085 works, not the
  board's illustrative 43-category label. Counts and URLs must remain exact.
- `theme/main.html` extends pinned Material; its shared header/nav shell appears
  on every generated/native page. Material owns search, palette and instant
  navigation. Existing disclosure navigation lives in `navigation.js`.
- Existing header controls: Material theme/search, `abp-a11y.js`, `abp-auth.js`,
  `abp-i18n.js`. Account/provider identity and storage keys remain unchanged.
- Six navigation parents: HOME; TODAY PANCHANG (Daily, Monthly/Hindu Calendar,
  Converter, Ephemeris); DEVOTIONAL WORKS (all 42 categories, Find, A–Z,
  Favourites); SCRIPTURES & BOOKS; TOOLS (Find, A–Z, Japa, Favourites, Feedback);
  ABOUT (Foreword, About Me, Contribution, Disclaimer, Legend, Rules).
  Category/group/subsection lists are generated separately and must not be
  replaced with the board's illustrative submenu or invented classifications.
- Existing search worker/index pairing, native reading pages, external book and
  YouTube destinations, Panchang/Ephemeris algorithms, location state and all
  saved preferences remain the functional source of truth.
- `abp-pwa.js` already captures beforeinstallprompt and registers the scoped SW,
  but creates an install control only for a prompt/iOS, has no mobile-menu entry,
  removes the control before userChoice and offers no unsupported-browser state.
- Manifest identity/start/scope: `/devotional/`; short name HDC. Preserve identity.
  The SW versions/pre-caches the shell plus calculation modules, caches visited
  pages, keeps search assets paired and never bulk-downloads catalogue/PDFs.
  Keep that strategy and all legacy cache/user-data names; only add required
  shared header assets to the versioned shell.
- Existing tokens: sandalwood `#fff5dd`, parchment `#f6e7c7`, maroon `#790d20`,
  antique gold `#c8953e`, warm reading ink; Noto Serif / Noto Sans fallbacks.
  Header menus switch at 1199px; reading layouts already adapt near 960/600px.
- Accessibility already supports large text, contrast, spacing, underlined links,
  stopped motion, disabled single-key shortcuts, focus and modal dialogs.

## Implementation plan

1. Complete baseline strict build, route/link inventory and desktop/tablet/mobile
   captures; distinguish expected external-provider limits from regressions.
2. Package exact dedicated panels from the owner-provided PNG, with extraction
   coordinates and source checksum. No generated alternative emblem or hero.
3. Add a shared header layer using existing tokens, Material search/palette and
   the existing complete nav tree; add compact mobile branding and six-item
   bottom navigation without inventing routes. Tools may open its existing menu.
4. Reuse existing account/language/accessibility controls; keep them reachable
   on mobile without duplicated listeners, controls or provider configurations.
5. Implement explicit install states shared by top-bar and mobile-menu controls:
   native prompt, dismissal, iOS guidance, unsupported browser and standalone.
6. Verify icons/manifest/scope, version required assets, preserve SW strategy.
7. Run strict build, existing regression suites and targeted install/header QA;
   capture final views, document limits, provide local preview and reviewable PR.
8. Stop for explicit staging approval. No production deployment in this task.

## Asset source limitation

The sole supplied source is `Hindu Devotional UI Design Board.png` (16 October
2026). Use the exact approved art, not an AI replacement. The board's app-icon
panels are below native 512px resolution. Report any resampling honestly; the
output dimensions alone are not proof of native detail or a vector master.

## Implemented staging changes

- `theme/partials/header.html`, `hdc-controls.html`, `hdc-bottom-navigation.html`,
  `abp-navigation.html`, `theme/main.html`: reusable shared shell; existing
  Material search/theme hooks and complete generated navigation retained.
- `docs/stylesheets/hdc-header.css`: burgundy desktop header, exact sunset panel,
  ivory/light and wine/dark mobile headers, six-entry bottom navigation, safe
  areas, focus states and measured sticky-header/bookmark spacing.
- `navigation.js`, `abp-auth.js`, `abp-i18n.js`: move existing account/language
  controls into the mobile drawer without cloning them; retain instant navigation,
  keyboard closing, focus trapping and active states. Native dialogs consume
  Escape before the background drawer. Resize observers are reused/disconnected.
- `abp-pwa.js`: one install state machine shared by the two real controls.
  Unsupported controls remain accurately disabled; a native offer is consumed only
  after a click. Accepted means requested, not installed. Actual `appinstalled` or
  standalone mode hides both controls. iPhone/iPad instructions are click-only.
- Manifest and icons retain application identity, `/devotional/` start/scope and
  legacy asset URLs. `hooks/generate.py` only adds required assets to the existing
  versioned shell; no service-worker strategy or calculation code is rewritten.
- `scripts/prepare_hdc_brand.py` and `docs/assets/images/hdc-brand/source.json`
  document exact owner-supplied panel coordinates/checksum. The 512px icon is
  resampled from 266×262 source pixels, not a native 512px master. The dedicated
  small-icon artwork is used rather than shrinking the full design board.
- The separately requested in-page Google translator is included in staging:
  lazy explicit opt-in, no proxy redirect/new tab, original-language restoration,
  retry on provider failure, and preservation of unrelated user preferences.
  Google attribution/UI is not concealed. It requires network/provider availability;
  its translations are automatic and have not received a linguistic accuracy audit.

## QA evidence (16 October 2026)

- Baseline and final strict builds passed; final build: 120.23 seconds.
- Complete final inventory: 2,265 HTML routes, 39,708 bookmark IDs, 10,311 internal
  destinations, 8,305 external destinations, **zero missing local files/bookmarks**.
  Comparison with the original baseline found no lost routes or bookmark IDs.
  The additional `vrat-katha-parayan/` route came from newer `main` changes merged
  into staging, not from this header implementation.
- Canonical collection, search registry, Firebase configuration and Firestore
  rules match the baseline SHA256 hashes. No data or astronomy module is changed.
- Panchang numerical suite: 16/16 groups. Ephemeris numerical suite: 10/10 tests,
  including independent native Swiss golden fixtures. Universal-search data,
  multilingual ranking and canonical coverage tests passed.
- Header/PWA browser checks passed at 320, 390, 768, 1024, 1280 and 1440px in both
  themes: controls, explicit prompting, dismissal, acceptance vs installation,
  unsupported and standalone states, menu focus, no overflow/overlap or JS errors.
  iPhone and desktop-UA iPad guidance/Escape checks passed under emulation.
- In-page translation tests passed at 390/1440px: consent, failed load/retry,
  nine language choices, same URL/tab, singleton widget, English restoration and
  preference safety. A separate real-provider check translated the staging H1 to
  `हिंदू भक्ति संग्रह`, retaining the same URL and one tab.
- Real Firebase SDK initialization passed with existing `udhc-devotional` config;
  no account was signed in and no cloud user data was written.
- Existing plugin tests passed at 390/1440px: guest favourites and legacy DB,
  Japa/legacy state, language, theme persistence, accessibility and navigation.
  Real first-install SW precache, offline homepage/fallback and new stylesheet
  caching passed. Numerical engines and saved-data keys remain unchanged.
- Site smoke checks, isolated homepage hook, section pager, interface dictionary,
  PDF/native information-page, approved artwork and reading-link audits passed.
- Final navigation suite passed at eight widths (320–1440px), including every
  navigation destination, all 42 category links, keyboard disclosures, outside/
  Escape closing, browser history, refresh and canonical section-pager boundaries.
- Final Panchang browser suite passed: eight branding widths, five calculation
  viewports, unified city workflow/cross-tab persistence, GPS/manual/share privacy,
  denied location, stale-result protection and real legacy-worker migration plus
  offline calculation. Calculation sources are unchanged.
- Search browser checks passed at 320/768/1440px in both themes, including aliases,
  native scripts, history, suggestions and safe links. Native information pages,
  footer and instant navigation passed at the same widths/themes.
- Royal-homepage suite passed at 320/390/768/1440/1920px plus dark-mode checks;
  shared-theme audit passed on all 2,265 pages. All 42 category layouts passed on
  phone and desktop; 24 representative page types passed across six viewport/theme
  combinations, including large-text/high-contrast containment and image checks.
- Reading browser suite passed at 320/768/1440px: all 24 books/96 reading links,
  safe English popup handoff, preserved Hindi/Listen controls and discovery-hub
  history/navigation. Feedback suite passed all 14 groups with a mocked endpoint;
  no real feedback submissions were made. No uncaught exceptions were reported
  by these browser suites. `git diff --check` passed.

The checks above were executed locally; the PR's GitHub Actions result is separate.
Reproduction commands are the existing `.github/workflows/check.yml` steps plus
`node scripts/test_approved_header_browser.mjs` and
`uv run python scripts/audit_header_site.py --output work/approved-header-staging/inventory.json`.
The full local baseline/final inventories are in the corresponding
`work/approved-header-baseline/inventory.json` and
`work/approved-header-staging/inventory.json` files (not shipped to visitors).

### Review assets and preview

Before/after desktop/mobile captures and tablet, dark desktop and mobile Install
App menu captures live in `scripts/fixtures/approved-header-review/`. CI retains
the complete width/theme matrix as `approved-header-staging-screenshots`.
Run `node scripts/serve_header_preview.mjs`, then open
`http://127.0.0.1:4310/devotional/`. The server binds only to loopback and does not
publish anything. The Tools bottom button opens the existing full Tools submenu
because there is no existing Tools landing-page route.

### Genuine limitations and release gate

Physical Android/iOS installation, OS launcher icon refresh, VoiceOver/TalkBack
and authenticated Google/cloud-favourites flows require device/account testing;
emulated/mocked install-event tests do not certify those external flows. External
links are inventoried, not all 8,305 destinations live-crawled. Local target and
bookmark checks are complete. No full WCAG conformance certification is claimed.
The board is the only artwork master; higher-resolution detail cannot be restored
by resampling. **Do not merge or deploy until the owner approves staging.**
