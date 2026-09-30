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
  (link straight to a search with `find/?w=hanuman+chalisa`)

## Progressive Web App (iPhone, iPad, Android)

The site installs as an app and works offline:

* **Install app** button in the header and an install card on the home page.
  * Android / Chrome / Edge: opens the browser's native install prompt.
  * iPhone / iPad (Safari has no prompt): shows the *Share → Add to Home Screen* steps.
* **Offline:** a service worker (`sw.js`, generated from `hooks/sw.template.js` on every build) precaches
  the app shell — home, master index, library, Find a Work with the full works index, and site search.
  Every page you open is kept for offline use; anything else shows a friendly offline page.
* **Save for offline:** each category page (and the Integrated Master Index for everything) has a
  *Save for offline* button showing the download size, with progress, *Refresh* and *Remove*.
* **Updates:** when a new version is deployed the app shows *"A new version is available — Update"*.
* Installed-app polish: back button in the header (iOS has no browser back button), notch-safe
  header, offline banner, app shortcuts (Master Index, Find, Library) and store-style screenshots
  in `manifest.webmanifest`.

## Phones & tablets

Tuned for Safari (iPhone / iPad) and Chrome (Android phones & tablets):

* **Phones** – every work becomes a card; empty "—" fields are hidden; the seven footer buttons become a
  thumb-friendly grid; the long "jump to form" list folds into a *Jump to a form* button.
* **Tablets** (iPad portrait, Android tablets, phones in landscape) – two cards per row; full table from
  ~960 px up (iPad landscape, desktops) with a sticky column header.
* **Fast on mobile** – sections with more than ~250 works are split into numbered pages (a form that spans
  pages is marked "— CONTINUED", as in the PDF), off-screen tables are skipped by the browser
  (`content-visibility`), the cover is served as responsive WebP, and the finder renders results in batches.
* **Touch & Safari details** – 44 px tap targets, 16 px inputs (no iOS zoom-on-focus), hover effects only on
  devices that can hover, notch-safe layout (`viewport-fit=cover`), fall-back colours for older iOS without
  `color-mix()`, no sideways scrolling.
* **Add to Home Screen** – web-app manifest, iOS touch icon and Android maskable icon, light/dark browser-bar colours.

## Hosting (GitHub Pages)

Live at **https://ashishbharani.github.io/devotional/** (repo `ashishbharani/devotional`).

Every push to `main` builds the site with uv and publishes it through GitHub Actions
(`.github/workflows/deploy.yml`). One-time setup on GitHub: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

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
docs/assets/images/       cover art (WebP/JPEG sizes), signature, diya logo, app icons
docs/manifest.webmanifest Add-to-Home-Screen manifest
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
| `/categories/NN-…/<group>/` (+ `part-N/`) | Works tables, pp. 759–4356 |
| `/find/` | Search across every work |

> Note: Material for MkDocs prints a notice about MkDocs 2.0. This project pins `mkdocs<2`, which is what
> Material supports, so the notice can be ignored.

The source PDF itself is not committed (it is ~98 MB); keep it next to the repo or anywhere on disk.
