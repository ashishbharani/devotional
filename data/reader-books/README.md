# Sacred Reader original-language sources

## Epic additions and simpler navigation

The owner subsequently requested Mahabharata and Valmiki Ramayana. The former
uses The Sanskrit Library's eighteen-parva critical-edition electronic witness
(1,995 chapters), under CC BY-NC-SA 3.0 with editor/contributor attribution.
Continuous SLP1 text is retained alongside deterministic Devanagari transcription.
The latter uses all seven Sanskrit Wikisource kandas (645 sargas), with exact
source revisions per chapter under CC BY-SA 4.0. Source spelling/edition variants
are retained; these are not newly corrected critical texts or Hindi translations.
Their separate licence files govern these databases, not unrelated site code.

Explicit maintenance: run `python scripts/fetch_reader_epics.py`, then
`python scripts/import_reader_epics.py`. Fetching is resumable and outside the
build. The fetcher checks all eighteen Library licence declarations and requests
the Wikisource revisions pinned in the database. Input/output hashes and licence
evidence are in the manifest. Review any changed source hash before publishing.
Run `python scripts/test_reader_epics.py` and the full Reader/build regression
suite after import. The ordinary build has no network corpus dependency.

Readers choose a book, then a chapter. Existing Gita/Manas chapter URLs and the
original `reader/#gita-2-47` bookmark remain compatible. Epic pages are on demand;
the installation shell does not download whole books or their full-text indexes.

## Earlier Gita and Manas imports

This separate text collection supports the owner's 4 November 2026 request for the whole Bhagavad Gita and Ramcharitmanas in Sacred Reader. It does not change `data/collection.json`, CWIDs, catalogue classification, PDFs or existing external reading links.

## Witnesses and scope

- **Gita:** original Sanskrit `text` fields only from `gita/gita`, pinned commit `c6fce39595445768876ddbb8d1268a9c935e1d2b`, `data/verse.json`. All 18 chapters and 701 contiguous source entries are retained. Chapter 13 includes the opening Arjuna question; this differs from 700-verse enumerations. No modern transliteration, word meanings, translations or commentary from that repository are imported. Its Unlicense is retained.
- **Ramcharitmanas primary:** all seven files from `WirelessAlien/Ramcharitmanas`, pinned commit `a8734282b3f95648032a53447f08ad77acb2ecd4`, `main/data/verses/`. All 1,074 original body reading units are retained in source order, including terminal units absent in the second dataset. The repository credits IIT Kanpur. Its Unlicense is retained.
- **Ramcharitmanas opening supplement:** only the 13 invocation units before the first chaupai in each kāṇḍa from `bhavykhatri/DharmicData`, pinned commit `96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7`, `Ramcharitmanas/`. These supply Sanskrit invocations and initial dohas missing in the primary dataset. The database is ODbL 1.0; its full licence is retained. The assembled Manas database is made available under those database terms, with attribution and a downloadable JSON copy. Rights in the ancient underlying composition are distinct from database rights.

No modern translations/commentaries or source-site layouts are reproduced. An alternative source with restrictive reposting terms was inspected but not imported. The legacy 2.47 passage, its source-checked IAST and Telang translation remain unchanged at the original route.

## Integrity and limitations

`manifest.json` records immutable repository commits, raw input SHA-256 values, output hashes and transformations. Whitespace normalization converts the primary Manas dataset's literal escaped CRLF to actual line breaks and trims only outer whitespace. No spelling, punctuation, verse suffix or wording is silently corrected. Gita imports only the original text and identifiers. Manas reading-unit IDs are source-order identifiers, not newly asserted canonical verse numbers.

The corpus is an attributed electronic witness assembled from the sources above, **not a critical edition or independent word-by-word scholarly certification**. Structural checks verify all expected chapters, contiguous Gita IDs, source-order Manas counts, opening/terminal fixtures, unique IDs, protected language markup, download identity and routes. Reporting transcription concerns remains appropriate. Do not infer that a dataset's licence validates every spelling or that one witness resolves all traditional variants.

## Reproduction

Download the exact paths from the three pinned commits into a local source directory. The importer expects `gita-verse.json`; the seven primary files named `balkanda.json`, `ayodhyakanda.json`, `aranyakanda.json`, `kishkindhakanda.json`, `sundarkanda.json`, `lankakanda.json`, `uttarakanda.json`; and the seven supplemental files prefixed `dharmic-` with their original filenames. Licence inputs are `gita-LICENSE`, `LICENSE` and `dharmic-LICENSE.txt` respectively. Then run:

```text
python scripts/import_reader_books.py --source-dir <download-directory>
python scripts/test_reader_books.py
```

Importing is explicit maintenance work. Ordinary site builds use the committed files and never download sacred texts. Preview-enabled builds publish 65 static reading pages and the attributed database downloads; default-OFF builds publish neither. Existing visited-page caching is extended only to the book HTML requested through Material instant navigation. Entire books are not automatically downloaded at installation; visited reading pages work offline after successful caching. A worker-version change follows the site's existing cache-update policy.

Run both strict build modes, `test_reader_books.py enabled/disabled` against the corresponding artifact, the new book browser test and existing Reader/state/navigation/worker regressions before review. The site theme and existing six-destination navigation remain intact.
