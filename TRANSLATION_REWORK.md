# Whole-site translation rework — 2 November 2026

## Status: INCOMPLETE — draft technical foundation, not a full translated release

The owner's confirmed scope is **all hosted text**, including editorial pages and
catalogue descriptions, in English, Hindi, Marathi, Gujarati, Bengali, Punjabi,
Telugu, Kannada, Malayalam and Tamil. External book readers remain external;
their contents are not copied, proxied or represented as locally translated.

This change removes Google Website Translator and repairs local language selection.
It **does not fulfil the complete full-text translation request yet**. Do not mark
the draft ready, advertise whole-site completeness, or deploy it as that completed
feature while the content backlog remains.

## Implemented

- Remove the provider module, its script registration, widget UI and provider CSS.
- Retire only `abp-google-translate-consent-v1` and the scoped `googtrans` cookies.
  Keep Google authentication, other cookies, language preference, favourites and Japa.
- Offer all ten local languages directly, without an external widget or collapsed
  secondary picker. Preserve the selected language across reload and navigation.
- Extend the existing catalogue with complete nine-target-language matrices for
  63 additional source phrases. These include core navigation/home headings,
  astronomy/location labels, language names and selected common descriptions.
- Translate matched text **nodes**, not parent HTML: preserve icons, links, event
  handlers, input values, editable content, code and sacred work originals.
- Handle dynamic element additions and text-only updates. Idempotent writes avoid
  observer feedback loops, and English restores the current source wording.
- Assemble translations per section instead of flattening missing language arrays,
  preventing a missing section from shifting all later keys to the wrong values.
- Disable the picker with an accessible failure label when its catalogue cannot
  load; never claim successful translation from an empty catalogue.
- Validate phrase matrices and publish an auditable whole-text backlog. Registered
  key coverage is explicitly not called whole-site translation completeness.

## Remaining content work

The source catalogue has 43,085 rows. Distinct values before deduplication across
fields include 907 purposes, 1,098 singer/recitation descriptions, 369 forms,
231 language descriptors, 13 timing descriptions, 10 Jyotisha descriptions and
9 affliction descriptions. Sacred titles are separately preserved/transliterated;
transliteration is not counted as translation of a description.

Many source values are extraction fragments rather than complete English sentences.
For example, `remembrance Murugan praise, devotion and sacred-site` and
`recitation Oduvar / traditional Tamil Shaiva` must not be expanded into invented
religious promises or an invented explanation. Source-meaning review is required.

Still required:

1. Classify the generated backlog: actual prose, parameterized UI templates,
   legitimate proper names/identities, and source-text defects. Unknown proper
   names are deliberately reported, not silently counted as translated prose.
2. Supply and review every remaining catalogue-description translation.
3. Translate all hosted About/Foreword/Contribution/Disclaimer paragraphs, keeping
   legal qualifications, contacts, numbers and the English originals intact.
4. Finish dedicated category-name translations outside Hindi; script conversion
   alone is not completion of this task.
5. Cover runtime-only tool messages and parameterized/date output, then validate
   actual rendered states, not just dictionary presence.
6. Obtain native-language/meaning review. The automated tests verify behavior and
   coverage, **not linguistic certification**.

## Verification commands

Verified locally against the checkpoint strict build (121.23 seconds):

- Ten local choices at 320/768/1440px, real translated labels rather than a mocked
  provider, reload persistence, no extra tabs, no translation-provider requests,
  dynamic text-only updates, English restoration and intact navigation SVGs.
- Existing HDC plugin suite at 390/1440px: guest favourites/legacy database, Japa
  legacy state, language, accessibility, persistent theme, navigation and console.
- Real PWA registration, precached styles, offline homepage and offline fallback.
- Registered matrices: 140 interface keys plus 63 additional phrases, with all
  nine target-language entries; deliberate missing-value fixture is rejected.
- Final output JS and catalogue hashes match the source files.
- Whole-text audit: 2,266 HTML pages, 43,085 canonical rows, 13,089 candidate
  source units; 12,983 remain unregistered for Hindi and 13,025 for each other target language.
  This is a review backlog, **not** 13,015 proven prose paragraphs: proper names,
  browser titles and parameterized UI require classification and template work.
- Machine-readable details: ignored `outputs/translation-coverage.json`; CI
  publishes the same audit as `work/translation-coverage.json` with screenshots.
- The completion-gate CLI was run and returned exit code 1 as expected: full-text
  completion is explicitly not achieved. Regression tests passed independently.
- Unavailable-catalogue test passed: named disabled picker, English source fallback
  and the saved Tamil preference retained for later retry. Input values, implicit
  option values, code and editable content remain unchanged; input labels translate.
- Panchang 16/16 groups (42 native lunar references); Ephemeris 10/10 tests
  (72 native reference cases) passed. Node 26 emits its existing experimental
  localStorage warning in the test environment; CI remains pinned to Node 24.

Earlier test-only issues were corrected: English must restore the original
uppercase HOME, not change it to title case; the negative catalogue fixture now
uses an in-memory reader rather than Windows-restricted temporary directories.
No production test was weakened to declare missing content translated.

```text
python scripts/check_i18n.py
python scripts/test_local_translation_catalogue.py
mkdocs build --strict
node scripts/test_translation_browser.mjs
python scripts/audit_hosted_translations.py --site site --output work/translation-coverage.json
python scripts/audit_hosted_translations.py --site site --require-complete
```

The final command is the **completion gate**. It must currently fail because
untranslated/review-pending candidates remain; that failure must not be suppressed
or described as a completed all-text translation. The ordinary coverage command
writes the backlog for continued work without pretending the backlog is empty.

Windows long paths: a short external build directory can be passed to MkDocs.
Set `HDC_SITE_DIR` to the same directory for the preview/browser test and pass it
with `--site` to the coverage audit. Build output is not committed.

## Safety

Based on main `4914311`. The separate restoration and unfinished mobile-Top
checkouts were not edited. No source catalogue/CSV, astronomy engine, reader URL,
authentication configuration, artwork or dependency/lockfile changes are included.
No merge or deployment is authorized by this draft.
