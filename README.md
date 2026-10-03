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
* **A–Z Directory**: fast, letter-by-letter browsing from the same canonical work index, rendered in small batches
* **Japa / Devotional Counter**: private, device-local counting with 108-bead mala totals, targets, undo and persistence
* Optional **Google sign-in and favourites**: guests use a local IndexedDB store; signed-in users synchronize only their saved-work metadata through their own protected Firestore path
* Installable **PWA**: a small application shell and pages the reader actually visits can work offline; the full catalogue is never precached

## Optional account and offline operation

Browsing never requires an account. Firebase configuration is intentionally left as placeholders until the site owner follows [FIREBASE_SETUP.md](FIREBASE_SETUP.md). The service worker precaches only the application shell and caches catalogue pages as they are visited; it does not download all generated pages, works, books, PDFs, YouTube content, or Firebase traffic. During activation it removes only obsolete `udhc-*` and legacy site-owned `abp-*` caches.

## Accessibility (WCAG 2.2 AA)

Built so elderly readers and people using screen readers, keyboards, switches or magnification can use it:

* **"Aa" button** in the header (saved per device): text size (4 steps, up to 150% — large text switches
  the tables to easy-to-read cards), **high contrast** (light and dark), **readable spacing**
  (dyslexia-friendly letter/word/line spacing), **underline links**, **stop animations**.
* **Screen readers (VoiceOver, TalkBack, NVDA):** every works table has a caption and real column/row
  headers, and keeps them in the phone card layout; YouTube links say they open a new tab; empty fields
  read "none"; buttons like *PREVIOUS* / *OPEN* / *LISTEN* have full names ("Listen to Bhagavad Gita on YouTube");
  search results are announced; focus moves to the new page heading after navigation.
* **Keyboard:** skip link on every page, logical tab order (also in the phone footer grid), strong two-tone
  focus ring, focused items never hidden under the sticky header or search overlay, dialogs trap and return focus,
  single-key shortcuts (S, N, P…) can be switched off in the Aa panel for voice-control users.
* **Structure:** one `h1` per page and no skipped heading levels (category → group → form), landmarks,
  status messages (search results, saving progress) announced, notices pause while hovered/focused.
* **Touch:** every control is at least 24×24 px (44 px on touch screens); links inside text are underlined.
* **Colour:** all text meets 4.5:1 contrast in both themes (category colours are darkened for text
  automatically, `cat_ink()` in the hook); Windows High Contrast / forced colours supported;
  respects *reduce motion*.
* Checked with axe-core on every page type, light and dark, phone and desktop (0 issues; the only report
  is a known false positive caused by off-screen `content-visibility` sections).

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
* **Browser polish** – favicon, iOS touch icon, light/dark browser-bar colours and a supported-device install control.

## Contributing

Not a programmer? Start with **[SETUP.md](SETUP.md)** (one-time, ~10 minutes) and **[CONTRIBUTING.md](CONTRIBUTING.md)**
(the short guide). Fixes and new works go into `data/corrections.csv` and `data/additions.csv`, which are applied on
every build; every pull request is checked automatically. AI agents (Codex, ChatGPT, Claude…) follow **[AGENTS.md](AGENTS.md)**.

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
docs/javascripts/abp-directory.js  A–Z batching and navigation
docs/javascripts/abp-japa.js       device-local Japa counter
docs/javascripts/abp-panchang.js   lazy Panchang application loader
docs/assets/panchang/              pinned engine, canonical date adapter, festival policy and Panchang UI
docs/assets/i18n.json     central interface translations for all ten languages
docs/assets/images/       cover art (WebP/JPEG sizes), signature, diya logo and icons
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
| `/master-index/` | Religious Music directory (the publication's Integrated Master Index), pp. 14–19 |
| `/categories/NN-…/` | Category sub-index (sections and deity subsections) |
| `/categories/NN-…/<group>/` (+ `part-N/`) | Works tables, pp. 759–4356 |
| `/find/` | Search across every work |
| `/a-z/` | Letter-by-letter directory over the canonical work index |
| `/japa-counter/` | Private device-local Japa / Devotional Counter |
| `/panchang/` | Full location-sensitive daily Panchang |
| `/hindu-calendar/` | Monthly Hindu calendar with Tithi and observances |
| `/date-converter/` | Gregorian ↔ Hindu date converter |

> Note: Material for MkDocs prints a notice about MkDocs 2.0. This project pins `mkdocs<2`, which is what
> Material supports, so the notice can be ignored.

The source PDF itself is not committed (it is ~98 MB); keep it next to the repo or anywhere on disk.
