# Reading-link repair — 16 October 2026

Base: main `f290e1d`. Branch: `fix/library-language-and-vrat-links`.
The rejected in-page reader (closed PR #36) is not included. All book buttons
remain normal external links. The restoration checkout is untouched.

## Findings

- The royal homepage added `find/?w=vrat` for “Vrat Katha & Parayan”. That
  single-term search is not a combined collection of both named literary forms.
- The library renderer simply reused the source catalogue URLs for each button.
  Many ENGLISH entries were identical to Hindi-only BharatKosha pages, and the
  Kena / Devi entries were Sanskrit-only. The IIT Kanpur Valmiki destination has
  certificate/access problems. Git history shows these URL values predate the
  homepage redesign; do not attribute every external failure to that redesign.
- Four current Adiveda readers already have English meanings, not just Roman
  transliteration: Hanuman Chalisa, Isha, Katha and Brihadaranyaka Upanishads.
  They remain unchanged and were included in live reading checks.

## Repair

- A shared, title-specific `hooks/library_readers.json` overrides twenty English
  destinations without editing `data/collection.json` or duplicating cards.
  The same renderer produces the homepage and full Library. It also fixes
  Valmiki OPEN and HINDI; every other OPEN/HINDI and all LISTEN URLs are unchanged.
- The new `vrat-katha-parayan/` page uses existing category 10 canonical sections
  for Vrat Katha and Parayan and category 7 Vrata-named observances. It links to
  the real catalogue pages, including their existing pagination and work IDs.
  No devotional works or translations are invented or added to the catalogue.
- Edition notes identify translators/commentaries and limitations: Ganesha is
  abridged; Valmiki's English site lists six Kandas; Devi Mahatmya links its actual
  cantos 81–93 within Markandeya, not Devi Bhagavata. Yajur is Keith's Taittiriya
  recension. Sundara English is explicitly the Valmiki version. Ramcharitmanas
  has its own separate bilingual Gita Press PDF, not a substituted Valmiki text.
- Safe new tabs retain accessible names and `noopener noreferrer`. No iframes,
  copied translations, provider proxies, third-party scripts or dependencies.

## Source validation

`node scripts/validate_english_readers.mjs` is an opt-in real-browser audit of all
24 English landing destinations and 23 actual HTML/text chapter/verse samples;
URLs/expected reading markers are in `scripts/fixtures/english-reader-probes.json`.
No provider content is stored in production. On the audit date, every check passed.

The Ramcharitmanas PDF returned HTTP 200/application-pdf. A temporary local copy
was inspected with pypdf/pdfium: 1,119 pages, with actual English translation
visually verified on PDF page 33 beneath the original and Roman transliteration.
It remains externally hosted, not copied into this repository/website. Its large
size is disclosed. The Internet Archive Sankhya scan is linked with a matching
English full-text reading check. Public reading required no sign-in in these tests.

Candidate Sacred Texts readers encountered access challenges in the browser,
and the IIT Kanpur Ramcharitmanas candidate had an invalid TLS certificate. They
were not installed, and no challenge or certificate validation was bypassed.

This verifies selected reading samples, not every chapter or translation's
accuracy/completeness, and does not guarantee third-party future availability.
Wisdom Library, Wikisource and other community hosts may contain transcription
errors; consult the named edition/scans and source tradition when in doubt.

## Regression coverage

- Strict MkDocs build and post-build route/CWID audits.
- `test_reading_links.py`: all 24 cards and 96 exact links on both hosts, immutable
  source data, unchanged Listen/Hindi/Open (except Valmiki), no iframe, and every
  Vrat/Parayan destination resolves to a built page.
- `test_reading_links_browser.mjs`: 320/768/1440px on both hosts, all 24 English
  popups per host, names/rel/target, no duplicate cards, overflow or page errors;
  homepage hub navigation, actual canonical rows for both named collections,
  and browser Back. CI mocks external destinations; the live audit is separate.
- Current i18n, official PDFs/pages, canonical pager, isolated homepage hook,
  approved deity art, Panchang, Swiss Ephemeris and existing plugin checks.

Screenshots are produced in `work/reading-links` and uploaded by PR CI as
`reading-links-screenshots`. No production layout redesign is included.
