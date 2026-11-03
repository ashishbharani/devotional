# Optional local section shortcuts

Default-OFF `HDC_PRACTICE_PREVIEW=1` adds a native expandable control to actual
generated category/group pages and a management list in My Devotional Journey.
These are user-chosen **navigation paths**, not another devotional-work favourites
database. Existing guest IndexedDB/Firebase favourites, Japa, Reader and journal
records remain untouched. No deity/tradition recommendation or identity inference
is performed. Different sections and paginated paths stay distinct.

`hdc-section-shortcuts-v1` stores `{schema:1,paths:[...]}`, capped at ten paths.
It does not copy names, prayer text, journal notes or machine-translated labels.
Paths are browser-profile-local plain text, not encrypted or cloud-synchronized.
Choosing a section is explicit; removal and confirmed list erasure only change
this store's `paths`. Unknown extra fields in a supported record survive editing.
Unsupported formats, malformed or unregistered paths are preserved without being
silently overwritten. Failed writes retain successive visit-only edits and explain
that the persistent copy stayed unchanged. Cross-tab events refresh saved lists;
they retain visit-only edits with a reload explanation instead of discarding them.

The preview-only `assets/section-shortcuts.json` derives routes and raw titles from
the generator's actual `_pages`. A record must resolve against this registry before
it can render or be saved. This prevents fabricated or external destinations and
does not change canonical data, classifications, URLs or CWIDs. Labels use literal
text and explicit translation exclusions. The registry loads only when saving a
shortcut or displaying a nonempty saved list; it is versioned but not globally
precached. The existing worker's on-demand asset caching can reuse a fetched copy
offline. Missing/unavailable metadata fails closed and keeps saved paths intact;
this is not a promise that all unvisited category pages are offline-ready.

Instant navigation aborts the old root's listeners and ignores detached async
work; the public registry promise is reused within the document. No observer,
background bulk fetch, account provider, analytics or new dependency is added.

Default builds omit the registry, UI and script activation/worker entry. The source
JS may exist among copied static files, as with the other preview modules, but is
never initialized by default production. No service-worker strategy is rewritten.

`test_section_shortcuts_browser.mjs` uses a dedicated4353 port. It verifies real
generated identities and pagination, raw canonical labels with route-only storage,
reload/instant-navigation/cross-tab behavior, a single save listener, own-list erase,
unknown-field preservation, ten-entry bounds, blocked/malformed/future storage,
missing/corrupt registries, literal-label safety and unchanged existing stores.
Screenshots: `work/section-shortcuts`. This is not authenticated cloud-sync, native
language, physical-device or complete-release certification.
