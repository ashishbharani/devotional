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

This runs 35 named steps: both strict builds and enabled/disabled release/SEO
gates; astronomy, data and metadata checks; search, navigation, plugin, header,
translation, reader, feedback, Daily Darshan, practice, festival, journey and PWA
browser suites. It leaves `site/` containing the preview artifact. Do not rebuild
while browser audits run. No merge, deployment or data editing is performed.

`work/release-qa/validation.json` records commands, source head and dirty state,
individual exit codes/timings/logs and before/after protected-file hashes.
Each completed run is archived under `work/release-qa/runs/`; `--only STEP...`
records a separate selected run and cannot masquerade as a full run. Inspect
`state`, `allStepsExecuted` and every exit code before claiming success.

## Performance scope and unresolved findings

The new feature JS/CSS/module source footprint is 29,431 bytes, below the explicit
100 KiB incremental source budget. This is not total download or runtime memory.
`performance.json` and phone/desktop screenshots accompany an unthrottled local
Chromium snapshot with external font CSS stubbed. No field LCP/INP/CLS claim is
made; `layoutShiftSum` is a raw observed sum, not certified CLS.

The initial desktop probe observed substantial layout movement (sum about 1.97;
phone about 0.003). A diagnostic found two major transient body/container changes
and smaller header-control insertion changes. Attribution and remediation remain
open; do not call the performance increment complete or its targets met.

## Remaining release gates

- Reviewed year/region festival dates are absent; original theme remains fallback.
- Reader is one original Sanskrit verse, without licensed translations/recordings.
- Design increment and wider journey/discovery/editorial scope remain unfinished.
- Real authenticated cloud sync, native installation on physical devices,
  assistive-technology testing and field performance have not been certified.
- Full owner review and coordinated staging approval are still required.

Rollback this increment through a reviewed revert of its commit, followed by both
build/gate checks. Do not reset user data or remove legacy storage. Turning off
the existing preview flag keeps unfinished routes and activation out of production.
