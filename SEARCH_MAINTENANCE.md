# Universal devotional search

## Architecture and authoritative content

`data/collection.json`, followed by the existing corrections/additions pipeline,
remains authoritative. Nothing in search rewrites a title, category, form,
language label, canonical work ID or publication URL.

The existing MkDocs hook calls `scripts/search_index.py` after canonical pages
and the compact work index are prepared. Each build derives:

- `assets/works-index.json`: unchanged compact canonical work rows.
- `assets/universal-search.json`: Unicode token postings, every category/section/
  subsection, scoped catalogue discovery names, source-backed identity aliases,
  relationships and metadata vocabularies.
- `assets/identity-graph.json`: the complete typed audit graph, including work-to-
  section and hierarchy edges. This larger file is **not fetched by searches**.

`search-core.mjs` is a pure deterministic engine, used by both Node tests and
`search-worker.mjs`. `universal-search.js` lazily loads one paired index per tab
and starts a module worker. A shared direct-engine fallback is available when a
worker cannot run. Results do not depend on a generative model or paid API.

The Find page, homepage entry form, A–Z entry form and header search's universal
catalogue result group use that same engine. Material's existing documentation
search is retained below the universal results; it is not a competing identity
dictionary. The A–Z letter directory remains unchanged.

## Coverage versus verification

Canonical coverage is automatic: every published work and hierarchy node enters
the derived postings and canonical title lookup without a popularity threshold.
Slash-separated names in existing headings are scoped to those catalogue nodes.
They are **not** assertions that separate religious identities are synonymous.

Supplementary external research is an initial finite pass, not exhaustive
verification of every regional name or every language. The registry's
`research_limit` and `proposed` entries explicitly preserve that limitation.
Unverified proposals are never used for identity expansion. Do not describe
canonical indexing counts as counts of independently researched aliases.

The catalogue has mixed and sometimes malformed language/form labels. Search
preserves these labels. A query language is matched against recorded metadata;
this is not independent verification of the work's language. Missing metadata
does not satisfy a requested language filter. Do not silently repair source data
through this index.

## Adding aliases and identities

Edit only `data/search-registry.json` for supplementary search knowledge. Give a
new identity a permanent, descriptive `id`; do not reuse another identity's ID.
`groups` must contain complete, exact existing collection group labels. These
connect works by authoritative classification, not fuzzy name similarity.
`title_phrases` may identify a particular form from explicit work-title phrases;
use narrow documented phrases, never a generic ambiguous epithet.

Each alias contains `text`, `type`, `language`, `script`, `source`, `status`,
`confidence` and `scope`. Only `status: verified` with a source is expanded.
The generated record adds the permanent entity ID and canonical name.

Allowed descriptive alias types include EXACT_ALIAS, ALTERNATIVE_NAME,
TRADITIONAL_NAME, REGIONAL_NAME, LOCAL_NAME, EPITHET, DEVOTIONAL_TITLE,
TRANSLITERATION, SPELLING_VARIANT, PHONETIC_VARIANT and
DOCUMENTED_HISTORICAL_NAME. Keep an unresolved mapping in `proposed`, with its
reason, rather than supplying a guessed relationship.

For a verified alternative work title, use an optional top-level `work_aliases`
array. Each record uses `work` containing the exact CWID, plus the same alias
fields above. A missing CWID or source fails the build. This links the alternative
title to that specific work rather than matching an arbitrary title substring.

Different entities may deliberately share an alias. For example Balaji, Shyam
and Madhava retain contextual choices. An alias whose scope starts with
`ambiguous` also presents a qualification even if only one eligible mapping is
currently recorded. Longer verified phrases, such as Shyam Baba, take precedence
over individual words. Selecting an identity adds a shareable `identity` filter.

Relationships have `from`, `to`, `type`, `source`, `status` and `confidence`.
FORM_OF, REGIONAL_FORM_OF, MANIFESTATION_OF, AVATAR_OF and WORSHIPPED_AS permit
bounded, cycle-safe parent/child discovery (up to eight edges). ASSOCIATED_WITH,
BELONGS_TO_TRADITION and other non-equivalence edges must not automatically
expand all works as synonyms. The full graph accepts the typed relations listed
in `scripts/search_index.py`; source-less or dangling relations fail the build.

The Banke Bihari form remains independent from Krishna. Its own classified works
rank before broader Krishna records. Parent searches expose related forms;
they do not replace their identities. A new identity uses the same machinery.

## Normalisation, matching and ranking

Unicode NFKC and Latin-only accent folding retain Indic vowel signs, viramas
and other meaningful combining marks. Native-script aliases are explicit.
Mechanical Brahmic/Tamil romanisation supplies additional lookup keys, never
translations or evidence of religious equivalence. Local-language sound changes
and arbitrary translations are not universally solved by transliteration.

Controlled edit-distance matching requires a single plausible correction.
Conservative phonetic matching is restricted to aliases whose candidates all
refer to the same verified identity. Ambiguous phonetic collisions are not
silently resolved. Exact canonical title lookup remains available regardless of
concept parsing, and explicit UI filters still apply.

Ranking is deterministic: exact title, literal title phrase, directly matched
identity/form, related child form, ordinary text/hierarchy, broader parent deity.
Publication order breaks ties. CWIDs suppress alias-generated duplicates without
merging legitimate separately identified cross-category records. Explanations
distinguish alternate names, direct titles and broader related deities.

## Performance and cache consistency

Postings avoid a full work-title scan on each keystroke. Title, hierarchy and
metadata keys are normalised once. Queries run in a worker; input is debounced,
results are batched (60 on phones, 200 on desktop), and stale async replies are
discarded. Indexes load on search intent, not ordinary homepage loading.

The compact work bytes have a SHA-256 digest in the universal index. The loader
refuses mismatched assets rather than connecting postings to incorrect works.
Search assets affect the existing service-worker version but are not precached.
The paired JSON files use network-first with same-version offline reuse. Original
Panchang, ephemeris and unrelated cache behaviour remains unchanged.

## Verification

Run from the repository root, with the existing project dependencies:

```sh
uv run mkdocs build --strict
uv run python scripts/check_site.py
uv run python scripts/test_section_pager.py
node scripts/test_universal_search.mjs
node scripts/test_search_browser.mjs
```

The search test reports actual build coverage, alias-record counts, graph edges,
startup time and warmed query timings. Its all-record audit verifies canonical
title lookup and postings for every work, all hierarchy nodes and graph referential
integrity. Full query acceptance examples and category filters are tested
separately. Browser tests cover phone/tablet/desktop, light/dark, Unicode, worker
loading, shareable URLs, history, suggestions, pagination and safe links.

For screenshots, set `SEARCH_SCREENSHOTS` to a local output directory. Existing
CI publishes the `universal-search-screenshots` artifact. Measurements from Node
or desktop emulation are not claims about physical Android-device performance.

Also retain the existing Panchang, ephemeris, navigation/search, feedback,
location, translation and PDF tests. No real feedback/payment submissions are
needed for this feature.

## Publication and rollback

Open a reviewed pull request; the maintainer merges and the existing GitHub Pages
workflow deploys after checks. Do not hand-edit or commit generated `site/` assets.
To roll back a merged search change, use a normal reviewed Git revert of the
search commit(s), then rebuild and deploy through the same workflow. This retains
the original collection and canonical URLs; no database migration is involved.
The separate PDF follow-up checkout is not part of this change.
