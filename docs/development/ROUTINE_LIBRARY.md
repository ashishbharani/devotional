# Three local journey follow-ups

These controls share the existing default-OFF `HDC_PRACTICE_PREVIEW=1` release
gate. They are staging increments, not a completed transformation or deployment.

## Saved routines

The optional library keeps at most ten names and 5/10/20-minute durations. Choosing
an entry changes the active draft and the existing Sanctuary handoff; it does not
save or replace journal notes. Saving adds a new entry; removing one preserves the
active draft. Names are rendered as text, never HTML.

The new `hdc-journey-routines-v1` key contains
`{schema:1,routines:[{id,name,minutes}]}`. Keeping it separate prevents an older
cached writer of `hdc-journey-state-v1` from dropping the whole library. The
existing active routine, journal and session schema is unchanged. No journal,
canonical work identity, account or location data is copied into the library.
Malformed/unknown library formats are retained without being overwritten. Failed
writes keep successive routine edits in memory for the current visit and say so.
These names are browser-local plain text, subject to the same shared-device
privacy limitations as the existing journey interface.

## Cross-tab draft control

Native storage events still warn without replacing an unsaved draft. The explicit
**Load saved changes (replace this draft)** action reads both saved records before
replacing the fields, library and summary. Invalid/unavailable records leave the
draft intact. No write-back loop or extra per-navigation global listener is added.

## Scoped practice-log erase

An expandable confirmation requires an explicit checkbox and button. The erase
reads the latest saved object and changes only `sessions` to an empty array,
preserving all other fields, including unknown fields. It does not save or discard
an unsaved journal draft, delete the library, or write Japa, Reader, favourites or
Firebase data. A failed write clears only the current in-memory view and reports
that the saved copy could not be changed. Invalid saved objects are left intact.

## Regression coverage

`scripts/test_routine_library_browser.mjs` covers legacy-state compatibility,
selection/removal, literal names, the ten-entry limit, cross-tab explicit reload,
malformed libraries, narrowly scoped erase and blocked-write memory continuity.
Screenshots are under `work/routine-library`. The original journey, continuation,
practice, shared-design and actual-worker suites remain enabled. No catalogue,
astronomical engine, provider configuration, approved artwork or production flag
is changed. Real authenticated sync, physical devices, wider editorial/source
work and final coordinated owner approval remain separate release requirements.

Actual local validation: 12/12 selected release checks passed: default strict build
(117.97s) and disabled gate; preview strict build (91.53s) and enabled gate; site,
metadata, i18n, original practice/journey suites, 96-case shared-design audit,
real worker upgrade and first-install offline suites. A final two-check run passed
the continuation and expanded routine-library suites. The latter checks malformed
journey objects and failed erase writes as well as the cases above at 375px light
and 1440px dark. Phone/desktop captures were visually inspected. Protected hashes
stayed unchanged in both runs. This is targeted validation, not a full 40-step
local run; the finite runner and PR workflow now include the new regression.
