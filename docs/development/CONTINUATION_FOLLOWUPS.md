# Five continuation follow-ups

All new Reader/discovery interfaces remain behind `HDC_PRACTICE_PREVIEW=1`.
No canonical content, identity, route, provider, astronomical calculation,
approved artwork or storage schema is changed.

1. **Daily Darshan resume.** The homepage reads strict boolean bookmark/read
   flags from the existing `hdc-reader-v1` store. Only the preview has a conditional
   link to the existing Gita 2.47 pilot. Missing, malformed or inaccessible storage
   retains neutral discovery. The Japa store remains authoritative and read-only.
2. **Reader cross-tab state.** Native storage events update bookmark, read status,
   font size and line spacing. They never write back or create event loops.
   Handlers are aborted when the rendered root changes. Invalid/removed settings
   return to safe defaults; clearing progress preserves typography preferences.
3. **Reader deep links.** `readerQuery` supports original-text filtering without
   taking over Material's `q` parameter. The existing passage hash takes priority
   over a hiding filter. Continue/permanent links reveal and focus the passage,
   including repeated activation of the same hash. Destinations are compared as
   resolved same-origin URLs because Material rewrites fragment links during
   instant navigation. Public passage sharing creates
   an origin/path/hash URL and excludes every query parameter, including filters
   and accidental tokens. No sacred text or translation has been added.
4. **Daily journey summary.** Today's self-reported counts/minutes use the
   browser's local civil date, explicitly labelled with its timezone. The existing
   rolling seven-day summary remains distinct. Future records do not inflate
   either summary. A local-midnight timer and visible-tab return refresh the view;
   navigation clears the timer/listeners. No history or Japa data is rewritten.
   Older cached markup without the optional daily paragraph retains its existing
   weekly summary instead of throwing an exception.
   This personal display does not change the canonical city or Panchang timezone.
5. **Shareable Explore filters.** Existing query/category/language/form controls
   restore from their public address. Edits replace the current history entry,
   retaining Material's history state and unrelated parameters/fragment. Browser
   Back restores the form. Values are validated against loaded canonical options;
   unsupported filters are visibly reported and removed from the shared address.
   Native GET submission still uses the original finder and ranking engine.
   Detached/outdated loads cannot rewrite another route's URL. No private journal
   or account data enters these links, and no new preference store is introduced.

`node scripts/test_continuation_browser.mjs` tests actual cross-tab events,
instant navigation, same-hash recovery, clean manual-share fallback, malformed
flags, listener count, metadata-derived filters, reload/Back, real finder results,
and the browser-local midnight boundary with unchanged stored records. Phone and
desktop captures are retained under `work/continuation` and uploaded by CI.

Run the original Daily Darshan, practice, journey/discovery, design and search
regressions too, plus enabled/disabled strict builds and offline lifecycle tests.
These additions do not complete reviewed recommendations, a larger source-verified
reader corpus, comprehensive authenticated journeys or the final release matrix.
Authored multilingual UI translations, field performance and real devices remain
separate verification work. Do not merge/deploy before coordinated owner approval.

CI run `41353175731` built the site successfully but timed out at the Reader's
cross-tab storage-reset check. The check now explicitly activates the returning
tab and polls state every 100ms instead of depending on animation frames in a
background page. The original timeout is unchanged, and assertions now require
all progress/typography defaults plus actual key removal. No application or data
code is changed by this CI correction. The workflow failure summary also points
to the actual failed step instead of automatically blaming a build/CSV error.

Local validation of this correction: default and preview strict MkDocs builds,
both corresponding feature gates, and the continuation browser suite passed
(375px light, 1440px dark, plus the civil-day boundary checks). The fresh GitHub
Actions run is the authoritative Ubuntu verification; local passes alone do not
establish that the original runner-specific timeout has been resolved.
