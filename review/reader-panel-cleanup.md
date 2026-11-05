# Reader panel cleanup

Owner request: remove the entire “Saved reading — Bhagavad Gita 2.47” demo
from the Reader directory and remove every generated “Text source and reuse”
panel, including its provenance, download list and explanatory paragraphs.

The directory now contains chapter/kāṇḍa discovery only. Gita 2.47 remains in
the complete chapter 2; homepage and routine shortcuts point there. The old
directory fragment still lands on the chapter 2 directory entry. Existing
local saved progress is not deleted, renamed or reset.

The complete-book text JSON, licence files and provenance manifest are
unchanged. A small Ramcharitmanas database credit/licence/copy line is retained
to satisfy the imported supplemental database's ODbL conditions; it is not the
removed source/reuse panel. No equivalent public-domain Gita panel is retained.

The isolated legacy-reader HTML fixture is test-only, never published. It
preserves regression coverage for historical local-storage data independently
of the removed demo UI. Integration tests use the actual chapter 2 reader.

`test_reader_cleanup_browser.mjs` checks the directory and removed panel on
phone and desktop; `test_reader_books.py enabled` audits all 65 generated
book pages and unchanged source-data hashes. Existing book, practice, reader
model and continuation suites cover saved state and offline navigation.

Combined release note (4 November 2026): PR #59 is incorporated into the four-book Reader branch at the owner’s request. Final coverage is 2,709 book-index/reading pages including 1,995 Mahabharata chapters and 645 Ramayana sargas. New epic credits are retained in compact lines under their source-specific licences. The final four-card screenshots supersede the earlier two-book directory screenshots.
