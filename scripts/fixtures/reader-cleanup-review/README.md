# Reader removal review

Before images were captured from the deployed site before this change; after
images come from the final strict preview-enabled build. Phone is 375px and
desktop is 1440px. The hub captures show the complete directory; book-end
captures show the removed source/reuse panel location.

The small Ramcharitmanas ODbL attribution and database-copy line remains for
licence compliance, without the old heading, provenance list or source notes.
The scripture text and database bytes are unchanged. These screenshots and
the separate legacy-controls regression fixture are test-only, not site assets.

Reproduce with `node scripts/test_reader_cleanup_browser.mjs`; `--live`
captures a baseline rather than asserting that deployment is already updated.
