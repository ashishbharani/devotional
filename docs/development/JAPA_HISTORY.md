# Optional local Japa session history

This preview-only extension uses the existing counter; it is not a second counter
or a spiritual-progress measure. `HDC_PRACTICE_PREVIEW=1` gates its generated panel,
script activation, numeric bridge and service-worker shell entry. Default builds
retain the existing counter and omit history activation and controls.
The preview shell includes the existing counter page so explicit recording also
works on its first offline visit after the preview worker finishes installing.

## Explicit recording and continuity

Start takes the actual in-memory counter count as its baseline. Finish saves the
positive, safe-integer corrected delta and UTC start/end timestamps. Counter
storage failures do not cause the baseline to fall back to an older saved count.
Ordinary Undo adjusts the delta; Undo below the starting count cancels recording.
Confirmed Fresh session and Reset change a nonpersistent continuity epoch, so a
restart at count zero also invalidates an active baseline. Existing target,
counter-reset, preference, sound and counting behavior is not changed.

Only preview counter roots expose numeric `data-japa-count` / `data-japa-epoch`
attributes from render. Neither field is added to `abp-japa-state-v1`. No practice
name is read or copied by the history controller. Start and Cancel never write
history; an unfinished recording is ephemeral and discarded on navigation. A
counter change from another tab cancels an ambiguous recording without resetting
the displayed counter. Existing counter cross-tab semantics are not rewritten.

## Storage and privacy

`hdc-japa-history-v1` contains `{schema:1,sessions:[{startedAt,finishedAt,count}]}`
with at most 50 finished records. UTC timestamps are displayed in the browser's
labelled local timezone. No prayer names, targets, original count snapshots,
journey notes, canonical IDs, location or authentication records are copied. There
is no network or Firebase operation. Counts and timestamps are plain text in the
browser profile, accessible to anyone using it and to same-origin scripts; this
is not encrypted storage or an account-protected vault.

Malformed JSON, unknown schemas and invalid or oversized records are retained,
with an explicit unavailable status. They are not silently normalized or erased.
When a write is rejected, consecutive edits use the valid in-memory history for
this visit and disclose that the persistent copy was unchanged. A later write
can persist that current history; other-tab changes do not discard unsaved
visit-only records. Known-schema unknown fields are preserved when appending or
erasing. Erase requires an expanded confirmation plus checkbox and explicit
button, and changes only this store's `sessions`. Counter/preferences, Japa daily
total, journeys/routines/journal, Reader, favourites and unrelated data remain.

## Lifecycle and QA

The panel is below the existing counter and linked from My Devotional Journey.
One controller renders the history; no duplicate implementation is added there.
Native storage events update saved history in other tabs. Its counter observer and
root-scoped event listeners are disconnected/aborted on instant navigation and
pagehide. No active recording or worker survives page removal.

`scripts/test_japa_history_browser.mjs` uses its own port4352. Run with `default`
against a normal strict build and without arguments against a preview strict
build. It covers actual taps, valid Undo correction, invalidated baselines,
confirmed zero-count restarts, unchanged old stores, failed counter/history
reads/writes, unknown formats, cross-tab changes, own-history-only erase,
navigation cleanup, the fifty-record cap and responsive light/dark controls.
Screenshots are under `work/japa-history`.

New private-tool prose is currently English; authored local UI/status translation
and native-language review remain part of the separate translation backlog. This
feature does not expand account synchronization or certify physical-device,
screen-reader or field-performance behavior. Keep the integration release draft
and production flag OFF until the full coordinated release is approved.
