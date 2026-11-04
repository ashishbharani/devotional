# Epic reading and simpler navigation — 4 November 2026

Owner requested deployment of Mahabharata and Valmiki Ramayana and a less
confusing Sacred Reader. Existing canonical catalogue, engines, providers,
artwork and unrelated navigation are outside this change.

## Contents and provenance

The initial Wikisource Mahabharata inventory revealed four absent vulgate
chapters. That incomplete witness was not imported. Instead this release uses
The Sanskrit Library's complete eighteen-parva electronic critical-edition
witness: 1,995 sequential chapters. All eighteen source catalogue pages were
checked for their explicit CC BY-NC-SA 3.0 grant. Required editor/contributor
credit, source links, non-commercial/share-alike notice and source hashes are
retained. Continuous SLP1 rows are retained with deterministic Devanagari
transcription. Critical-edition chapter numbering differs from vulgate editions.

Ramayana uses 645 fixed-revision Sanskrit Wikisource sargas across seven
kandas, under its linked CC BY-SA 4.0 terms. Exact revision/page attribution
is retained per chapter. Original poem/preformatted blocks are extracted;
audio, navigation and unrelated source notes are excluded. Some revisions have
unclosed/mismatched presentation tags, and one uses a bold title plus BR lines;
the importer recognizes those explicit boundaries rather than dropping text.
These are attributed electronic witnesses, not independently corrected critical
texts. Hindi translations are not bundled or claimed. No Gita Press text is used.

`scripts/fetch_reader_epics.py` is an explicit, resumable maintenance downloader;
`scripts/import_reader_epics.py` performs offline extraction. Builds use only
committed data. All book databases/downloads retain source-specific licences.

## Reading flow and compatibility

The hub has four book cards. Each book has its own contents page; the epics
group chapters under expandable parva/kanda headings. Reading pages show the
original text and bookmark/read controls, with search/typography/sharing/clear
actions in an expandable options panel. At the owner's explicit request this
branch combines PR #59: the standalone 2.47 demo and repeated source panels
are removed. Its old directory fragment points to a direct chapter-2 verse-47
link. Existing homepage and routine shortcuts open that full chapter. Required
Manas, Mahabharata and Ramayana credits/licences remain as compact credit
lines; the original databases, licence files and provenance remain available.
Existing flags, store keys and older chapter URLs are retained. New epic pages
cache only after visits, including instant navigation; whole epics are not
precached and do not inflate the native index. Historical transliteration and
translation protection remains covered by an isolated test-only fixture,
without publishing the removed demo.

## Verification

Source coverage/transcription/licence/unique-ID tests pass. Final strict build,
generated-route/source-download checks, existing regressions and responsive/
offline browser checks are pending at this checkpoint; no deployment is claimed.
