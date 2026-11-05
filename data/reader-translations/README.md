# HDC original-language book translations — review-only authoring

## What can be translated

Four locally hosted public-domain ancient compositions are currently available
as original-language Reader data, with **separate electronic-witness/database
licences**: Bhagavad Gita (18 chapters, 701 source entries), Ramcharitmanas
(seven kandas, 1,087 reading units), Mahabharata (18 parvas, 1,995 chapters)
and Valmiki Ramayana (seven kandas, 645 sargas). Their individual source
editions are documented in `data/reader-books/README.md`. Source passage
counts, not chapter counts, determine book translation completeness.

The original Sanskrit/Awadhi remains permanently visible, unchanged,
searchable and linkable. Transliteration is not translation. A new original
revision invalidates an old translation pack. Translations are separate,
licensed derivatives as applicable, not replacements for the ancient verse.

External book-reader websites and linked PDFs cannot be silently copied,
proxied or machine-translated by this site's local language selector. Obtain
independent reuse rights and an authorized source corpus before importing an
additional text.

## Reviewed pack format (NO actual packs approved yet)

Place a JSON file at `data/reader-translations/<book-id>/<language>.json`
only after human review and source/rights clearance. The builder accepts
the nine codes `hi,mr,gu,bn,pa,te,kn,ml,ta`. Example below is **illustrative
syntax only** (hashes and text must be replaced with exact reviewed content):

```json
{
  "schema": 1,
  "book": "bhagavad-gita",
  "language": "hi",
  "sourceSha256": "<sha256 of original book file in the original manifest>",
  "status": "reviewed",
  "review": {
    "reviewer": "<real independent reviewer>",
    "reviewedOn": "YYYY-MM-DD",
    "evidence": "https://<actual auditable review decision URL>",
    "rightsNote": "<actual source permissions, attribution and derivative rights>"
  },
  "translations": {
    "gita-1-1": {
      "sourceSha256": "<sha256 of exact original passage text, UTF-8>",
      "text": "<faithful reviewer-approved translation>"
    }
  }
}
```

A pack can contain selected passages. An absent passage is **not**
represented as translated. The page displays a reviewed translation only if
book ID, language, full-source hash, individual passage hash, status and
review metadata match. An invalid pack blocks the build. This check **does
not** verify that the person named actually reviewed it; require independently
verifiable human approvals before public release.

If a book has no approved pack, the Reader says so and always offers the
original. Only the language/book pack requested is downloaded. Drafts must
stay in a separate review directory and must not be silently published.
Do not infer sacred-meaning correctness from dictionary counts or machine
translation, and do not copy copyrighted contemporary commentaries.

## Whole-site completion is a separate release gate

`python scripts/audit_reader_translations.py --require-complete` reports
**zero unresolved passages only when all nine book-language pairs have every
source passage represented**. This is still not a linguistic certificate.
Record native-language reviews, Sanskrit/Awadhi subject-matter review,
legal/licence approval and owner approval for each entire edition.

The established site-text audit separately covers all hosted editorial and
catalogue text; book translations are in addition to it. The publication
default-OFF gate for unfinished Reader features remains unchanged.
