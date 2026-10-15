# HDC — existing integrations and branding audit

Scope: existing-plugin connections and current project branding only. Baseline:
the approved makeover merged as `d0f9698`. No CSS, layout, font, image, template,
catalogue, calculation engine, provider identity or reading destination changes.

## Existing inventory / verification

| Existing component | Connection / verification |
| --- | --- |
| Material search, universal search and advanced filters/aliases | Existing MkDocs plugin, loaders and worker retained; search engine/browser suites |
| Category/deity/form navigation, pager, A–Z | Existing generated routes and handlers retained; route, pager, navigation/search suites |
| Scripture/Books OPEN, ENGLISH, HINDI, LISTEN and work/YouTube links | Existing destinations untouched; homepage/link audits and native reading-page suite |
| Japa counter | Actual legacy-state load, increment, undo and reload in the HDC plugin test |
| Guest favourites | Actual IndexedDB add/reload/list; existing `udhc-favourites` database retained |
| Google/Firebase | Existing public configuration untouched; live Firebase initialization and Google OAuth handoff verified on 15 October 2026 without choosing an account |
| Authenticated Firestore favourites | Implementation and rules unchanged; actual cross-device reads/writes require an authorized account and were not performed |
| Panchang, Hindu Calendar, Date Converter | Existing initialization/settings/workers retained; numerical, full browser/shared-location suites and actual Gregorian conversion output |
| Ephemeris, monthly mode, Lagna/houses/topocentric controls | Current/Date/Monthly UI calculations and coordinate retention verified; native Swiss references and location-workflow browser suite; implementation untouched |
| Language/transliteration, accessibility, light/dark mode | Existing controls retained; language and reading/motion/theme persistence tested across reloads |
| Offline PWA, install UI and service worker | Existing registration/worker retained; three missing makeover CSS assets reconnected to the first-install shell |
| Feedback/error reporting | Existing Formspree URL unchanged; existing mocked submission/context/error suites; real delivery not submitted or claimed |
| Contribution facilities | Existing QR/payment details and links retained; source/PDF integrity audit; no payments performed |
| Shared header/footer and account/navigation controls | Existing placement and markup unchanged; no duplicate controls after navigation; mobile/desktop tests |

No missing application script imports or duplicate plugin instances were found.
The older `abp-cleanup.js` is a retired worker-migration utility, not an active
plugin to run alongside the current PWA: blindly enabling it would unregister
the working service worker. It remains untouched.

## Confirmed repair

`on_post_build()` omitted `navigation.css`, `royal-home.css` and `sacred-site.css`
from its versioned PWA shell. First-visit offline operation could therefore lack
the makeover's navigation and appearance. Added only those existing asset paths.
The regression test uses a real service worker, checks first-install cache entries,
then reloads offline and checks the existing navigation styling and HDC branding.

## Canonical branding / compatibility

Current browser/header/footer/social/application branding is **HDC — Hindu
Devotional Collection**. The homepage continues spelling out **Hindu Devotional
Collection** without an extra word or layout change. Current website references
in native information pages/docs are rebranded, not rewritten.

Deliberately preserved: `.udhc-*` CSS classes, `#udhc-*` anchors/ARIA references,
`udhc-favourites`, `udhc-last-favourite-scope`, `udhc-*` cache names and build
sentinels, all `abp-*` preferences, CWIDs, Firebase project/auth/storage IDs,
Firestore paths, historical PDF/document titles and archived screenshot captions.
No identifier rename is needed, so no destructive data migration is introduced.
Normal existing versioned-cache activation remains unchanged.

Native text integrity normalizes only the exact new current brand back to its
archived source spelling before the existing full-text SHA comparison. Every
other word, PDF byte, legal clause and contribution detail stays protected.

## External prerequisites / limits

Firebase SDK URLs returned HTTP 200; the live configured app reached ready state
without initialization errors and opened `accounts.google.com`. No credentials,
account selection, sign-in completion or Firestore read/write was performed.
End-to-end cloud favourites therefore remain unverified without an authorized
user. Provider settings and security rules have not been loosened or replaced.
Feedback delivery, external book/YouTube availability, physical-device install
prompts and actual GPS permission depend on their providers/browser/user; tests
do not pretend to authorize them. No new feature or placeholder was introduced.

## Checks

Use the existing strict build and all existing test/audit scripts, plus
`node scripts/test_hdc_plugins_browser.mjs`. Its cloud SDK is intentionally blocked
to exercise actual guest/offline behaviour; this is separate from the real live
Firebase handoff probe above. PR CI repeats the deterministic checks. A direct
baseline diff must remain empty for stylesheets, images, templates, data, PDFs,
astronomy modules, Firebase configuration and Firestore rules. Review screenshots
are branding-only comparisons, not a new design proposal.
