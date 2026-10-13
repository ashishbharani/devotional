# Native information pages

About Me (`docs/about.md`), Foreword, Contribution and Disclaimer are complete native HTML/Markdown pages. Do not replace them with PDF buttons, PDF embeds or shortened summaries. The four source PDFs stay at their existing asset URLs only to preserve old inbound links; normal reading does not depend on them.

The Foreword includes the complete six-page source text. The Disclaimer contains all 18 parts and 72 clauses of version 1.1, dated 03 October 2026. Print contents/page numbers are replaced with internal clause links. Wording is preserved except for normalising the website brand to Hindu Devotional Collections. The source disclaimer's page 20 contains hidden older content beneath a visible correction: follow the **visible** page (primary contact ashishbharani984@gmail.com, mobile +91-9289800984; 9870521478; grievance officer Adv. R.K. Bharani), not the overlapping extraction layer. Do not infer or rewrite legal clauses.

The About Me portrait is a literal crop of the supplied document image. The Contribution QR PNG is extracted byte-for-byte from the original embedded image, not recreated. Bank/UPI values are transcribed from the visible source; payment processing is not implemented. The source's same-phone instruction says “this page” instead of “this PDF” to fit its new medium.

After approved content changes, verify against the complete source (including visual review), update the corresponding normalised full-article hash in `scripts/check_project_pdfs.py`, and run:

```sh
uv run mkdocs build --strict
uv run python scripts/check_project_pdfs.py
uv run python scripts/check_site.py
pnpm exec node scripts/test_project_info_browser.mjs
```

The audit checks full text, legal clause/part coverage, archived source bytes, original QR bytes and payment values. The browser test covers native content without PDF dependencies, image loading, clause links, header clearance, mobile/tablet/desktop layouts, both themes, high contrast, keyboard focus and ABOUT/footer navigation. Do not submit payments or send feedback during testing.
