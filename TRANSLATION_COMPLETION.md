# HDC: full ten-language translation completion contract

**State: incomplete.** PR #56 is a merged partial checkpoint, not a complete
translation release. Do not label the site "100% translated" or deploy a new
completion claim merely because the interface language picker works.

## Scope and exclusions

The English source is authoritative. Hindi, Marathi, Gujarati, Bengali,
Punjabi, Telugu, Kannada, Malayalam and Tamil must each cover **all hosted
translatable text**: site/navigation labels, About, Foreword, the currently
published Disclaimer (all current clauses and linked headings), category /
section / form labels, catalogue descriptions and metadata, reader interface,
search/results, messages, form labels, accessibility attributes and dynamic
states (including errors and offline modes).

Preserve original sacred work titles, verse originals, book links, canonical
IDs, source/reference strings, URL destinations, legal numbering, and any
content explicitly marked not to translate. Transliteration of a sacred title
does **not** count as translated descriptive prose. External book-reader
contents are outside the hosted-site boundary. The Contribution page/payment
materials currently withheld from publication must remain withheld.

When a literal/proper name should remain unchanged, record an explicit,
reviewed classification rather than silently counting it as a translation.
Source defects and ambiguous religious terms must be escalated for editorial
review, not guessed or given fabricated promises.

## Repeatable incremental workflow

1. From the current repository revision, build: `uv run mkdocs build --strict`.
2. Inventory all pages and the canonical collection with
   `uv run python scripts/audit_hosted_translations.py --output work/translation-coverage.json`.
   The inventory now includes metadata and hierarchy labels that JS may
   render only at runtime, not just source HTML. This is a **backlog**, not a
   linguistic accuracy certificate.
3. Create a review bundle with
   `uv run python scripts/export_translation_review.py --audit work/translation-coverage.json`.
   Preserve the fingerprinted JSON as the import source and use the CSV only
   as a reviewer-facing view.
4. Work **one language and one manageable content batch at a time**.
   Translate every source unit faithfully, preserving qualifiers, negation,
   URLs, numbers, legal force and traditional terminology. A native-language
   reviewer should inspect it. In the `review.json` record, enter approved
   language values, set `reviewStatus` to `approved`, and fill `reviewer`.
   Other languages may remain blank for sequential review.
5. Check the proposed changes without modifying data:
   `uv run python scripts/import_translation_review.py --review PATH/TO/review.json --audit work/translation-coverage.json`.
   Once checked, add `--apply`. Existing approved pack entries cannot be
   overwritten by this importer. Regenerate the build, audit and review
   bundle after an import; previously exported provenance will then be stale.
6. Extend runtime/browser test cases for genuinely dynamic elements and
   revisit every page type at phone and desktop widths. Confirm language
   switching, English restoration, offline reuse, PWA behavior, screen-reader
   attributes, links and the publication safety restrictions.
7. Repeat until every target-language backlog is resolved and independently
   reviewed. Then run the strict completion gate:
   `uv run python scripts/audit_hosted_translations.py --require-complete`.
   It must exit successfully. A zero missing count is **necessary but not
   sufficient**: runtime-state inventories and native-language review must
   also have passed, and any remaining proper-name exceptions must be
   explicitly justified and reviewed.

## Release policy

Keep translations on a separate, reviewable branch and preserve production
until approved. GitHub functional CI can pass while translation work is
incomplete: that is intentional and **not** a complete translation result.
A completion declaration requires separately recorded per-language coverage,
page/dynamic-state tests, source fidelity and owner approval. Do not relax
the completion gate, fill gaps with copied English, or substitute language
transliteration for meaning translation.
