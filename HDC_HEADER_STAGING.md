# Approved HDC header / navigation / PWA staging

## Approval gate and recovery

No merge or production deployment is authorized until the owner approves the
complete staging build. Baseline: `f290e1ddd280f79c70c5ea7b441ed97536d88b87`,
local branch `checkpoint/approved-header-baseline-2026-10-16`.
The earlier, unfinished in-page translation integration is separately preserved
at `0dec9f0` / `checkpoint/in-page-translation-2026-10-16`; do not silently publish
that unfinished checkpoint or lose it while working on the header.

Rollback: before merge, close the staging PR and return to the baseline branch.
After an approved release, revert the reviewed implementation commit through a
new PR and rebuild. Never clear user storage or reset canonical data to roll back.

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

## QA status

Pending baseline/build, inventory, implementation, targeted tests, screenshots
and review. This document is not a claim of completed validation.
