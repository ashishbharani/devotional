# Preparing native-language review without changing production text

The hosted-text audit reports candidates, not proven prose. Some are canonical
brands, proper section names or extraction fragments. Do not translate a brand,
invent religious promises or exempt unknown names simply to clear the report.

After a strict preview build, regenerate the audit before exporting:

```text
uv run python scripts/audit_hosted_translations.py --output work/translation-coverage.json
uv run python scripts/export_translation_review.py
uv run python scripts/test_translation_review_export.py
```

The audit fingerprints the catalogue and interface dictionary. The exporter
rejects a missing or mismatched catalogue fingerprint, so an old report cannot
be presented as having been checked against a changed catalogue. The dictionary
fingerprint identifies the audited snapshot, not current linguistic approval.
The exporter reads the report and frozen catalogue without modifying either. It
writes a digest-named directory under `work/translation-review`, containing:

- `review.json`: exact source, stable audit ID, audit/catalogue hashes, missing
  languages, occurrence counts, example pages, metadata matches and blank review
  fields. Every record remains unreviewed; release eligibility is false.
- `review.csv`: the same source IDs and blank language columns for human review.
  Formula-like source values are escaped for spreadsheet viewing; JSON preserves
  the exact original. Import CSV using its standard comma delimiter/UTF-8 encoding.

Suggestions come only from exact matches to existing brand/category/section
labels or catalogue fields. They are not semantic, linguistic or theological
approvals. Several fields can match one source; ambiguous classifications require
review. Source quotations need appropriately sourced language versions, rather
than silently replacing the credited original through the interface dictionary.

The exporter has **no import/publish function**. It refuses to overwrite an
existing digest directory, preserving any entered native review. Use a fresh
`--output-dir` when a separate copy is needed. Completed files still require
meaning/source review and a separately reviewed dictionary patch; stale source
IDs must never be imported blindly. Private runtime input/notes are not copied:
the input is the public generated-HTML/catalogue audit, not browser storage.

An earlier preparatory pack contained 13,452 candidates. Counts change when
public source text changes; use the new pack manifest rather than assuming that
old count. Every new export contains empty target-language translations. Tests cover exact-source IDs, input
immutability, deterministic metadata suggestions, malformed/stale/duplicate input,
Unicode, CSV formula handling and entered-review overwrite prevention. This is
review preparation; it does not reduce the missing-translation count or satisfy
native-language certification. The existing `--require-complete` audit gate and
all deployment restrictions remain unchanged.


The regression is included in CI and the finite local runner. It also executes
an isolated real audit: source fingerprints must match, export must remain
unreviewed, and --require-complete must still fail for missing public text.
No translations, exemption rules, hosted text or runtime controls are changed.
