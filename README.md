# Ultimate Hindu Devotional Collection — MkDocs site

A browsable website version of the PDF publication **Ultimate Hindu Devotional Collection — Reworked Publication 2026**,
collected & compiled by Advocate Ashish Bharani.

* 43,085 works · 42 master categories · ~2,100 deity / tradition sections
* Every work links to the same YouTube search the PDF uses
* Custom **ABP Devotional** theme (on top of Material for MkDocs) that mirrors the PDF: parchment page,
  glossy category-coloured title bars, the 42 coloured master-index bars, the orange-bordered works tables,
  red play icons, book-cover library cards and the seven-button footer
  (`<<< Previous section · << Previous · Top · Home · Back to index · Next >> · Next section >>>`)
* Light "parchment" and dark "lamp-light" colour schemes, responsive card layout on phones
* **Find a Work** page: instant client-side search over all works with category / language / tier filters

## Quick start (uv)

```bash
uv sync                 # creates .venv with mkdocs + mkdocs-material
uv run mkdocs serve     # http://127.0.0.1:8000
uv run mkdocs build     # static site in ./site (≈1 min, ~130 MB)
```

## How it is put together

```
data/collection.json      structured data extracted from the PDF (single source of truth)
scripts/extract_pdf.py    PDF -> data/collection.json + docs/assets/images/
hooks/generate.py         MkDocs hook: builds every page from the JSON at build time
theme/                    ABP Devotional theme (Material custom_dir: main.html + partials)
docs/stylesheets/abp.css  theme styles and colour tokens (sampled from the PDF)
docs/javascripts/abp.js   Find a Work page logic
docs/assets/images/       cover art, signature, diya logo
mkdocs.yml                site configuration
```

Pages are **generated**, so there are no thousands of Markdown files to maintain. To override any page, drop a
hand-written file at the same path under `docs/` (e.g. `docs/foreword.md`) — it wins over the generated one.

### Updating from a new edition of the PDF

```bash
uv run --group extract scripts/extract_pdf.py "path/to/Hindu Devotional Collection.pdf"
uv run mkdocs build
```

The extractor reads the PDF's layout (table columns, section bars, link annotations, category colours) and
checks itself against the counts printed in the PDF's Integrated Master Index.

### Site map

| Path | From the PDF |
| --- | --- |
| `/` | Cover page (the two cover buttons are clickable, as in the PDF) |
| `/foreword/`, `/disclaimer/`, `/legend/`, `/rules/` | Front matter, pp. 2–10 |
| `/library/` | Hindu Scriptures & Books Library, pp. 11–13 |
| `/master-index/` | Integrated Master Index, pp. 14–19 |
| `/categories/NN-…/` | Category sub-index (sections and deity subsections) |
| `/categories/NN-…/<group>/` | Works tables, pp. 759–4356 |
| `/find/` | Search across every work |

> Note: Material for MkDocs prints a notice about MkDocs 2.0. This project pins `mkdocs<2`, which is what
> Material supports, so the notice can be ignored.

The source PDF itself is not committed (it is ~98 MB); keep it next to the repo or anywhere on disk.
