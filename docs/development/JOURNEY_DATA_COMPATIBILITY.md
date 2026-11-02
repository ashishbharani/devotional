# Journey saved-data compatibility

The preview Journey keeps its existing hdc-journey-state-v1 key and legacy
name/minutes/journal/sessions format. No migration, new account store or
calculation change is introduced.

A real browser regression reproduced routine saving dropping an unknown saved
field. The same permissive read path could turn corrupt data into an empty
object and overwrite it on the next action. Reads now validate before writing;
unsupported records remain intact with an explanation. Unknown fields in valid
legacy objects survive routine/note saves, note erasure and log recording.

Known fields, when present, must have the existing types and UI bounds:
name at most 120 characters; duration 5/10/20; journal at most 5,000 characters;
at most 50 sessions with valid timestamps and supported durations. Missing legacy
fields receive their existing defaults. A schema marker is unsupported because
the original format has none; it is never silently downgraded or stripped.
Invalid/oversized entries are preserved, not silently filtered or truncated.

Failed writes retain visit-only changes and unknown fields. If another tab then
changes saved Journey data, those memory-only edits cannot overwrite it when
storage becomes writable again. An explicit successful Load saved changes may
replace the draft; invalid/future saved data keeps the draft and saved data.
Scoped log erasure uses the same validation before touching sessions. No other
store, cloud provider or existing favourites record is edited.

Test: node scripts/test_journey_data_browser.mjs (preview build; port4354).
It covers preserved unknown fields, corrupt/future/session-invalid records,
blocked reads/writes, repeated memory-only session recording, cross-tab recovery
and explicit valid/invalid loads. Existing routine, continuation, Journey and PWA
suites remain required. This does not certify cloud sync, physical devices or
native-language coverage. The coordinated release stays draft and default-OFF.
