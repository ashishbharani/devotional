# Journeys, discovery and sharing — initial preview slices

All additions use the default-OFF `HDC_PRACTICE_PREVIEW=1` staging gate. A normal
production build omits the two new routes, activation scripts, links and schema
changes. Do not publish an individual increment before coordinated release QA.

## Journey privacy and data contracts

`journeys/` links to the authoritative existing Japa, favourites and Reader tools.
It reads numeric Japa count and Reader progress only; no prayer name or account
favourites are copied. Existing IndexedDB/Firebase scopes remain untouched.

`hdc-journey-state-v1` holds one custom routine, optional journal and at most 50
self-reported practice entries. Notes require explicit opt-in plus Save. They are
plain text, unencrypted, browser-profile-local and NOT cloud-synchronized. The UI
warns against sensitive notes on shared devices. Journal content is never placed
in URLs, metadata, sharing payloads or canonical files. The private form is marked
notranslate; authored local UI translations remain future work. Third-party/site
scripts in the same origin can access local storage: this is not a secure vault.

Erasing a journal preserves routine/history and all existing stores. Storage
failure keeps controls available for the visit; cross-tab notices preserve an
unsaved draft instead of silently replacing it. Seven-day summaries cover elapsed
time and are explicitly self-reported, not measured Japa or spiritual achievement.
Routine durations hand off to the existing Sanctuary's validated 5/10/20 presets.
The query-string preset handoff is verified online and offline. Preview builds
precache the exact three supported `sanctuary/?minutes=5|10|20` addresses and the
approved portraits. A fresh service-worker install is tested before any preset
visit, followed by offline timer interaction and the actual journey link. Other
query strings are not normalized or silently treated as cached presets.
No new counter, authentication provider, journal sharing or spiritual ranking.

After a storage write fails, subsequent saves use the current in-memory journey
state instead of rereading stale persistent data. Repeated session records,
routine saves and journal-only erase preserve the visit's history. Successful
writes restore normal persistence; failed writes never erase the previous store.

This initial slice does not implement multiple routines, authenticated journey
sync, comprehensive Japa session history or favourite-deity preference storage.

## Canonical discovery, not another search algorithm

`explore/` uses `abpSearch.load().compact`: real category labels, documented
languages and forms populate native GET selectors. Submission uses existing
`find/?w=...&category=...&language=...&form=...` contracts. Existing identity,
alias, graph, ranking and related-form rendering stay in the finder unchanged.
No regions/traditions/kuladevata relationships are inferred or invented when the
index lacks a verified field. Direct category/library/A–Z/advanced-search links
remain usable if metadata cannot load; Retry reuses the existing loader.

The approved six-destination mobile navigation is retained; a five-destination
redesign is not silently substituted in this increment. Wider discovery facets
still need verified source data and review.

## Accurate SEO and sharing foundation

Preview category/group metadata uses its real title and category. BreadcrumbList
JSON-LD follows the same Home → Devotional Works → Category → Group hierarchy as
the visible breadcrumbs, using existing canonical URLs. No work IDs or new thin
work pages are generated. Existing approved social imagery and WebPage schema
remain. The private journey page has noindex/nofollow; user notes are never SSR.

Public-page sharing is user initiated, with native share, clipboard and manual
copy fallback. It includes the current URL/filters/anchor, not form values. The
journey/favourites pages are excluded; Reader keeps its existing passage control
instead of adding a duplicate. No analytics or tracking provider is installed.

`templates/editorial-article.md` is outside docs and intentionally unpublished.
It requires primary sources, rights, region/tradition scope and review before
copying into publication. No religious article or fake ratings/FAQ are invented.

Existing sitemap/canonical deployment remains. Project-level `/devotional/` does
not confer ownership of the host's root robots.txt; no ineffective project robots
file is presented as host-wide control. Genuine authored language alternatives,
Search Console/index coverage, field metrics and public-brand repository settings
remain unverified/not changed. No SEO rankings, traffic or popularity guarantee.

## QA and continuation

Use `scripts/test_journey_discovery_browser.mjs`, existing search/metadata tests
and `test_practice_release_gate.py` against enabled and disabled builds. Preview
screenshots: `work/journey-discovery`. No physical-device, authenticated cloud,
screen-reader certification or field performance claims follow from headless tests.
Full transformation completion still requires the remaining progress-record items.
