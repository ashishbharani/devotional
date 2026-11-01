# Preview PWA and integration validation

All transformation additions remain behind the default-OFF
`HDC_PRACTICE_PREVIEW=1` gate. This is development evidence, not release approval.
Do not deploy an individual increment. The approved design, canonical data,
astronomy engines, provider settings and existing user stores are preserved.

## Offline repair

The worker matches exact URLs. Caching `sanctuary/` alone did not cover the
journey link's `?minutes=10` address. Preview builds now include the exact 5, 10
and 20 minute aliases, plus the existing approved Ganesha/Shiva portraits.
The cache signature includes each query identity and its underlying HTML bytes.
There is no arbitrary query normalization or change to the worker strategy.
`hooks/sw.template.js` remains untouched. Default builds omit these additions.

`node scripts/test_pwa_release_browser.mjs` reproduced the missing alias against
the previous artifact, then passed against the repaired preview. It verifies a
fresh worker install before any preset visits, all three offline timers, the
actual journey handoff, offline portrait, online Reader recovery and unchanged
legacy Japa state. CI runs it and uploads `work/release-qa` as lab evidence.

Integration review also found that rereading storage after a rejected write lost
earlier session-only journey entries. Journey actions now retain the current
in-memory state after failure, including routine save and journal-only erase.
The browser regression records twice, saves a routine, clears a journal and
checks both history retention and the unchanged previous persistent value.
The original frozen-artifact run exercised all 35 steps: 34 passed and the new
journey regression correctly failed with one retained record instead of two.
The complete log is retained under `runs/1793549755930567900`. Rebuild before
testing the repair; selected reruns are recorded separately, not relabelled as a
new full run. Final per-step outcomes are in the generated validation records.

## Reproducing the finite regression run

Install with `pnpm install --frozen-lockfile --ignore-scripts`, then run:

```sh
uv run python scripts/run_release_validation.py
```

This now runs 39 named steps: both strict builds and enabled/disabled release/SEO
gates; astronomy, data and metadata checks; search, navigation, plugin, header,
translation, reader, feedback, Daily Darshan, practice, festival, journey and PWA
browser suites, shared design/enhanced reading, worker version transitions and
lab-metric boundary tests. It leaves `site/` containing the preview artifact. Do not rebuild
while browser audits run. No merge, deployment or data editing is performed.

`work/release-qa/validation.json` records commands, source head and dirty state,
individual exit codes/timings/logs and before/after protected-file hashes.
Each completed run is archived under `work/release-qa/runs/`; `--only STEP...`
records a separate selected run and cannot masquerade as a full run. Inspect
`state`, `allStepsExecuted` and every exit code before claiming success.

## Performance scope and unresolved findings

The initial feature JS/CSS/module source footprint was 29,431 bytes. The current
value is recorded in `performance.json` and checked against the explicit 100 KiB
incremental source budget. This is not total download or runtime memory.
`performance.json` and phone/desktop screenshots accompany an unthrottled local
Chromium snapshot with external font CSS stubbed. No field LCP/INP/CLS claim is
made; `layoutShiftSum` is a raw observed sum. `labCls` separately uses the largest
session window (less than one second between shifts, less than five seconds per
window), excluding recent input. Boundary/invalid-entry tests protect that math.
The 1000ms observation interval after load/image decode ends before screenshot
capture; viewport visibility, supported APIs and large-shift source rectangles
are recorded. Tablet width joins phone/desktop. These are finite lab samples.

The initial desktop probe observed substantial layout movement (sum about 1.97;
phone about 0.003). A diagnostic found two major transient body/container changes
and smaller header-control insertion changes. Attribution and remediation remain
open; do not call the performance increment complete or its targets met.
Isolated desktop and alternate-preview-origin traces did not reproduce those
large shifts. This variability is not proof of a production fault or its absence;
retain the traces and investigate before claiming a performance pass. No approved
layout is changed speculatively to improve the measurement.

## Existing-installation lifecycle

`node scripts/test_pwa_upgrade_browser.mjs` serves the real generated worker with
a test-only previous version and CSS comment marker. A deliberately unavailable
shell asset must reject the next installation while the old offline shell stays
interactive. Restoring the asset permits an ordinary worker update: old cache
names/CSS bytes must retire, an unrelated cache must remain, and Japa, Reader and
journey values must survive unchanged. The upgraded ten-minute offline timer is
exercised, followed by real built-in Material search while offline. Fixtures live
only in the test server; provider configurations and storage schemas are unchanged.
The test waits for actual worker state transitions, not an asynchronous
`waitForFunction` predicate (which can be treated as a truthy Promise by the
installed browser harness). This covers the
current worker's version transition, not every historical worker or native app
installation on physical devices. Evidence: `work/pwa-upgrade`.

The test exposed uncaught offline Material XHR errors for its uncached native
search index and sitemap. Preview builds now precache the existing Material index
and worker, sitemap and interface dictionary, with an explicit combined 4 MiB
budget (about 2.84 MiB initially). The larger universal-search payload pair stays
on demand; its matching/ranking and datasets are unchanged. Built-in text search
is not a claim that every advanced universal-search query is available offline.
`sw.template.js` adds one exact sitemap XML dispatch using its existing asset
strategy, without returning the HTML offline page as XML. This narrow worker
change is intentional for the tested offline/version-transition repair; there is
no cache-name/schema migration or astronomy modification. The helper precache is
preview-only; ordinary builds retain on-demand caching of visited resources.

## Remaining release gates

- Reviewed year/region festival dates are absent; original theme remains fallback.
- Reader is one original Sanskrit verse, without licensed translations/recordings.
- Wider design review and journey/discovery/editorial scope remain unfinished.
- Real authenticated cloud sync, native installation on physical devices,
  assistive-technology testing and field performance have not been certified.
- Full owner review and coordinated staging approval are still required.

Rollback this increment through a reviewed revert of its commit, followed by both
build/gate checks. Do not reset user data or remove legacy storage. Turning off
the existing preview flag keeps unfinished routes and activation out of production.
