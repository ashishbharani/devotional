# Sacred Reader Hindi/English investigation — incomplete checkpoint

Base: `3537f64`, current main after PR 62. Earlier uncommitted translation
and restoration checkouts are preserved. No production deployment is authorized
by this report; this branch is not complete-translation delivery.

## Reproduced cause

The live Reader book hub explicitly says Hindi translations are not included.
The Gita chapter-2 route shows original Sanskrit for passage 2.47. The newer
full-book route does not inherit the historical pilot's one English passage.
There are no production book-translation JSON packs at all. Additionally,
both the collector and browser loader omit `en` from their accepted codes:
English was treated as the original language despite the books being in
Sanskrit/Awadhi. The combined readiness report also omitted English books.

## Implemented

- Accept source-pinned English packs using the same validation and display
  path as Hindi. Preserve original text and passage IDs.
- Include English in book coverage and combined readiness. Omitted Reader
  language counts now fail rather than silently becoming zero.
- Regression fixtures exercise initial English display, Hindi/English
  switching, unavailable languages, original preservation, partial-pack
  absence, stale hashes, search and 320/1440px widths.
- Draft original Hindi/English wording for all 47 Gita chapter-1 source
  entries, with per-passage source hashes and explicit interpretive notes.
  These drafts are not published or represented as independently reviewed.
- CI checks draft identity, chapter coverage and separation from publication.

## Validation

- Strict MkDocs build, default mode: passed (171.69s).
- Strict MkDocs build, Reader-enabled mode: passed (145.05s).
- Reader pack validation fixtures: passed, including English and Hindi.
- Reader browser translation fixtures: passed at 320px and 1440px; no page
  exceptions or horizontal document overflow in the exercised routes.
- Draft source/coverage checks: passed for all 47 bilingual entries.
- Interface checks and combined-readiness regression: passed.
- Site smoke checks: passed for 16 routes and 43,085 canonical work IDs.
- Reader source, all generated routes/downloads and epic attribution checks:
  passed (2,709 index/reading pages; original data unchanged).
- Complete Reader coverage gate: **fails as expected**. There are zero
  installed production translations in each language, 44,280 missing
  source-entry/language pairs across four books and ten languages. Some
  source entries are whole chapters/sargas, not individual verses.

## Remaining work

The original website text is still only partially translated. Complete
Hindi/English book text has not been installed; the other target book languages
also remain missing. The 47 bilingual draft entries are not a finished Gita,
much less all four books. Continue original translation authoring from the
ancient witnesses, source comparison and linguistic checking; do not copy
modern editions, invent reviewer approvals, weaken completion checks, or
deploy this checkpoint as the completed feature.
