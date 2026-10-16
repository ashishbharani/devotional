# Approved-header visual correction

Baseline: deployed PR #39, `c7bc6aeced09a1e33eb17c91af8ef0f9fab144ea`.
The owner reported a visual mismatch, then explicitly requested deployment of
the correction on 16 October 2026. Merge/deployment must still wait for checks.

## Cause and correction

The earlier checks established functionality and responsive containment, not
sufficient visual fidelity. The title was too small/bold, the sunset was obscured,
gold corner ornaments and the lotus divider were absent, and duplicate homepage
search/navigation/quotation blocks pushed the mobile hero far below the header.
Old Material and navigation specificity also overrode intended alignment/spacing.

- `hdc-header.css`: lighter/larger serif title, reference-sized emblem, clearer
  source sunset, actual source gold corner/lotus panels, filled icon family,
  wider navigation distribution, improved dropdown presentation and aligned
  desktop Install App caption. Mobile has the same real install control as the
  desktop plus its required labelled menu entry; both share existing state logic.
- `theme/main.html`, `hooks/royal_home.py`, `royal-home.css`: reuse the existing
  hero search as the single universal-search entry. Retain the quotation and all
  seven auxiliary destinations below the hero, with the links in a disclosure.
  Remove excess top padding on the homepage only. Centre and size the mobile
  hero heading, preserving the original illustration, text, controls and routes.
- `hdc-controls.html`, `abp-navigation.html`: decorative icons/chevrons only;
  original navigation tree, labels, IDs, destinations and handlers retained.
- `prepare_hdc_brand.py`, brand `source.json`: exact original PNG panel crops,
  with matte removal for transparent gold ornaments, never generated substitutes.
- `hooks/generate.py`: add the five small ornament assets to the existing PWA
  shell; no service-worker strategy, astronomical engine or data modification.
- New `test_header_fidelity_browser.mjs`: reproduces the former layout failure,
  then checks hero proximity, one search entry, retained auxiliary links,
  one-line/light-weight desktop title, actual lotus, caption alignment and
  unclipped controls at six widths in both themes. This supplements, not replaces,
  manual reference/screenshot comparison. CI retains the screenshot matrix.

## Visual evidence and constraints

See `scripts/fixtures/header-fidelity-review/README.md` for actual before/after
captures and native-resolution reference/staging header strips in both themes.
The existing hero illustration is intentionally retained as requested; the
board's phone-body illustration is not substituted for it. Live HTML controls,
accessible touch targets and the complete real menu are retained instead of
turning the board into a nonfunctional screenshot. No pixel-identical claim is
made for the entire homepage or the board's illustrative submenu contents.
The supplied PNG remains the only master; previously documented 512px icon
source-resolution limitations are unchanged.

## Validation

Final strict build passed (103.89 seconds). Source and compiled CSS SHA256 hashes
match; all five new ornaments are included in the generated service-worker shell.
Panchang numerical tests passed 16/16 groups; Ephemeris passed 10/10 tests.
New reference-geometry checks passed at 320/390/768/1280/1440/1536px, light/dark.
The exact-label navigation and information-page tests caught the initial text
chevron problem. The source now uses an empty, aria-hidden CSS chevron; those
tests remain unchanged. Final reference geometry and information-page suites
passed after that fix. Final navigation, offline/plugin, translation and feedback
reruns and the full GitHub check are release gates, not checks to bypass.

Other completed regression coverage includes the original royal-homepage,
all-page sacred-theme, Panchang/location/PWA migration, multilingual universal
search and 24-book/96-link reader suites; numerical/data/dictionary/PDF/artwork
audits passed. CI reruns the entire suite on the final PR head before merge.
The complete link inventory has no missing local files/bookmarks. Canonical data,
astronomical modules and provider configuration are absent from this diff.
Physical installation and authenticated account tests are not claimed.

A separate nested preview output hit Windows' path-length limit. The standard
`site/` strict build succeeded without changing any long catalogue URL or slug.

## Rollback

Revert the eventual visual-correction PR through a new PR and rebuild. Do not
reset canonical data, user preferences, old URLs or unrelated newer main changes.
Physical-device app installation and authenticated cloud-sync certification remain
outside the fresh-browser/emulated checks; no real feedback submissions are sent.
