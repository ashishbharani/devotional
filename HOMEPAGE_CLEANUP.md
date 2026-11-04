# Owner-requested homepage cleanup — 4 November 2026

- Sacred Reader replaces the old inline link and is centered on its own row,
  using the same daily-path card styling as Explore Deities. Existing release
  activation is unchanged; production already enables the Reader.
- Devotional Sanctuary is retired from navigation, homepage, Reader and Journey
  links, generated output and new offline caches. Journey routines retain their
  saved names/durations and open the Reader instead. The unbuilt source and
  existing browser-local preferences are preserved for recovery, not published.
- Festival appearance preview controls are absent from visible/keyboard UI.
  Reviewed automatic festival presentation, date evidence, India boundaries and
  original-theme preferences remain. Old saved design-demo modes cannot revive
  a preview on reload. Internal inputs remain hidden for the existing engine;
  tests exercise them programmatically, not as exposed visitor controls.
- Newer main-branch PR #59 removed the saved-passage demo and repeated Reader
  source/reuse panels. Preserve that cleanup rather than restoring those panels
  as disclosures. Original licence files, the minimal required Manas attribution,
  copyright, disclaimers and source-code notices remain intact. Do not add
  prominent optional licence-credit blocks in future content changes. This is
  presentation cleanup, not licence removal or a change in reuse rights.

Retired-Sanctuary tests now assert absence and retain Reader/offline/state checks.
No catalogue records, astronomy calculations or existing user data are removed.

CI follow-up: Journey initialization is idempotent per connected root, so
duplicate Material/pageshow notifications cannot discard an unsaved draft or
cancel a lazy catalogue search. The search button waits for listener readiness.
The routine regression holds its first index request while issuing a duplicate
pageshow; saved library durations remain tested while their handoff now targets
Reader rather than the retired Sanctuary URL.

Merge integration with PR #59 retains the full-chapter Reader UI. Reader/PWA
tests operate on the actual chapter containing Gita 2.47, not the removed demo.
