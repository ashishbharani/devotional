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

Source coverage/transcription/licence/unique-ID tests pass. Combined enabled
strict MkDocs build passed locally in 222.19 seconds; the branch workflow also
passed its strict build. Four-book navigation, chapter endpoints, the old Gita
directory fragment, bookmarks and layout passed at 320/768/1440px in both themes.
Both epic visited chapters and bookmarks passed with the actual offline worker.
The removed-demo/panel checks passed at 375/1440px; refreshed before/after
screenshots are in scripts/fixtures/reader-cleanup-review. Catalogue/engine diff
is empty and the built Reader runtime matches its source. Remaining existing
regressions and final exact-head GitHub CI must pass before merging; this note
records that pre-merge checkpoint and does not claim production deployment.

## Latest-main integration checkpoint

Main advanced with the approved retirement of Sanctuary and festival-preview
controls. That main state is preserved in merge head 69df1e4. Its local strict
build passed in 298.33 seconds. Fresh six-viewport/theme epic navigation,
endpoint, legacy-link, bookmark and real offline checks passed; cleanup checks
passed at 375/1440px and the after screenshots were refreshed.

The fresh CI upgrade test reached the intentionally collapsed Reader options
panel without opening it, so its search fill correctly timed out. The test now
clicks the visible summary before filling; its offline interactivity, failed
update, successful update, cache retirement and saved-state assertions are
unchanged. That focused regression passes locally. Full exact-head CI remains
a merge gate. No production code or budget was changed to accommodate the test.
