# Expanded Sacred Reader request — 4 November 2026

The owner expanded the books release to Bhagavad Gita, Ramcharitmanas,
Mahabharata and Valmiki Ramayana, each with a Hindi translation. PR 57's
green original-text CI is evidence for its two-book head only, not completion
of this expanded request. Keep the release draft until the new content is ready.

## Sources actually inspected

- Existing pinned Gita and Ramcharitmanas imports contain original-language
  text only. Awadhi is not a substitute for the requested Hindi explanation.
  The local DharmicData samples also contain original verse, not Hindi meaning.
- https://github.com/Ashutosh-Vijay/Valmiki_Ramayan_Dataset : README describes
  English meanings, cites IIT Kanpur/Gyaandweep and admits merged verses,
  missing meanings and pending manual verification. Its MIT wrapper does not
  establish complete Hindi coverage or permission for upstream translations.
- https://zenodo.org/records/6467313 : eighteen Sanskrit Mahabharata files
  are listed. The inspected Adiparvan file explicitly retains BORI copyright
  (1999) and reference-only/source-file terms. An open download is insufficient
  evidence for unrestricted republication; no text from this source imported.
- https://hi.wikisource.org/wiki/रामचरितमानस : a historical annotated edition
  is visible, but the landing-page contents only link the Bala kanda. Remaining
  kanda transcription, translator/editor identity, scan alignment and reuse
  notices still require verification before claiming a complete Hindi corpus.
- Candidate repositories with incomplete AI-generated Gita translations were
  excluded as evidence of complete authored Hindi coverage.

## Remaining content gates

The owner selected Gita Press as the preferred Hindi publisher. This selection
is recorded without treating it as a republication licence. The official
https://gitapress.org/terms-condition page was inspected; its accessible body
did not expose a text-reuse grant. The official ebook route is
https://gitapress.org/ebook. No permission denial is inferred either.
Publisher contact listed on its site: booksales@gitapress.org. No message sent.

Before importing the publisher's translations, obtain the exact editions and
an applicable reuse grant (or establish public-domain status of those specific
translations). Free reading/download and third-party blanket claims are not
treated as evidence covering repository redistribution and offline copies.

Pin complete reusable editions, retain translator attribution and licences,
verify every parva/kanda/chapter and terminal passage, and align Hindi units
with the chosen original witness without guessing across numbering variants.
Render original and Hindi separately, with independently identified sources.
Retain the existing Gita 2.47 bookmark identity. Keep epics on demand and out
of the first-install full-text index; keep chapter discovery and local search.
Run coverage, escaping, accessible bilingual reading, navigation, saved-state,
offline and cache-budget tests, then fresh strict build and exact-head CI.

No new epic or Hindi translation has been imported by this audit. No catalogue,
engine, artwork, saved preferences or production data was changed.
