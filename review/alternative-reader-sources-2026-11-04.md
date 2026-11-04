# Alternative source investigation — 4 November 2026

Owner requested alternatives after confirming no Gita Press permission.
This is a source-discovery record, not a complete corpus or republication
clearance. No text was imported and no permission request was sent.

## Bhagavad Gita — strongest Hindi lead

- https://gita.novoverse.app/hi/credits/ identifies Hindi translation and notes
  as Tilak's Gita Rahasya translated by Madhavrao Sapre, 1933 edition; claims
  public-domain status and 701 verses across 18 chapters. Its terms repeat
  the attribution: https://gita.novoverse.app/terms/.
- Independent government biography confirms Sapre died on 23 April 1926:
  https://newindiasamachar.pib.gov.in/WriteReadData/flipbook/2023/Apr/2nd/English/files/basic-html/page45.html
  and https://cgculture.in/ (Sapre award biography).
- Historical scan lead:
  https://epustakalay.com/book/47864-geetarahsya-athva-karmyogshastra-by-pt-madhavrao-sapre/
- Before import: identify the underlying scan/title and edition pages, verify
  translator/edition provenance and all chapter endpoints, separate verse
  meanings from extended notes, align the chapter-13 enumeration, and retain
  attribution. The site's public-domain assertion is evidence to investigate,
  not independent verification of every displayed word.

## Valmiki Ramayana — original text plus incomplete Hindi lead

- https://github.com/svenkatreddy/Ramayana_Book documents seven kandas,
  645 sargas and 23,334 Sanskrit verses. Its README identifies Sanskrit
  Wikisource plus three restored IIT Kanpur chapters; those restorations need
  independent rights/provenance treatment.
- Hindi is attributed to Chaturvedi Dwarka Prasad Sharma. The inspected README
  explicitly reports only 13,030 Hindi verses (55.8%) and OCR errors. Do not
  import it as a complete Hindi translation or infer a transferable grant from
  another project's statement that it has permission.
- Historical scan leads (not cleared downloads):
  https://hindibooks.guru/product/valmiki-ramayan/ lists a ten-volume Sharma
  translation and two-volume Jwala Prasad Mishra translation. Establish the
  actual scan editions, publication/author evidence, full volume coverage and
  accurate transcription before using either.

## Mahabharata — explicit Sanskrit licence, Hindi still unresolved

- https://sanskritlibrary.org/catalogsText/titus/mbh/mbh01.html explicitly
  licenses this XML edition under CC BY-NC-SA 3.0 with required credit and
  same-licence derivatives. This is a conditional reuse lead, not public
  domain and not Hindi. Verify all eighteen parvas and any upstream conditions
  before selecting a full edition; retain its licence separately from code.
- https://egangotri.org/2017/05/10/list-of-154-naval-kishore-press-books-digitally-donations-to-egangotri/
  lists Mahabharata Hindi Sabha Parva, Naval Kishore Press, 1931, 187 pages.
  This identifies a historical scan, not a full eighteen-parva corpus and not
  sufficient permission/title-page evidence on its own.
- Ganguli/Roy results are English, not the requested Hindi. Abridged Dutt
  retellings must not be represented as complete original epics.

## Ramcharitmanas — historical commentary lead, not complete verified Hindi

- https://hi.wikisource.org/wiki/रामचरितमानस exposes a historical annotated
  edition but its contents do not establish completed transcription of all
  seven kandas. Inspect the index scans, attribution and page status.
- https://epustakalay.com/book/27274-shri-ramcharit-mans-vijaya-teeka-bhag-1-by-pt-vijayanand-tripathi/
  identifies Vijayanand Tripathi's Vijaya Tika, part 1, 1,016 pages. Only part
  1 is established by this listing; author/edition rights, all other volumes
  and text alignment remain to be checked. Do not infer reuse from download.
- https://ramayana.com/about explicitly attributes its Manas Hindi commentary
  to Hanuman Prasad Poddar and its Valmiki Hindi to Ramnarayan Dutt Shastri,
  both Gita Press editions. This is not a substitute avoiding the unresolved
  Gita Press question, even though the website is free to read.

## Import boundary

The existing original-only two-book PR has passed its configured tests. It
does not satisfy four books with Hindi. Keep PR 57 draft; no placeholder
translations, automated meanings presented as reviewed text, or partial
sources presented as whole books. Verify exact editions and completeness,
then import with hashes, source-specific licence/credit, reliable unit
alignment, original/Hindi separation, on-demand pages and full regressions.
