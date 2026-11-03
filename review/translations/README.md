# Translation authoring and meaning-review handoff

This directory contains review material, not runtime content. No file here is automatically imported, served as a translation pack or treated as linguistic approval.

## First authored batch

`interface-batch-01.json` provides 12 existing high-frequency interface labels in Hindi, Marathi, Gujarati, Bengali, Punjabi, Telugu, Kannada, Malayalam and Tamil: **108 model-authored draft values**. The exact sources were matched against the existing `a5c4bd512fa57c00` review pack, without generating a replacement pack or overwriting prior review work. The original audit fingerprint is retained. Structural verification passed: unique known sources, exact source IDs, nine nonempty values per row, and no review/release eligibility claim.

This is a small start on L1, not completion of the whole-site inventory. The existing pack has 13,452 candidate records: 9,811 hosted-text, 2,455 catalogue-field, 1,141 section-name, 42 category-name and three brand-literal suggestions. These are old-snapshot candidates, not an exact count of prose requiring translation or a current coverage percentage. Names, metadata, fragments and real prose still require contextual classification. No suggested exemption has been accepted merely to reduce the backlog.

## Required review

All nine language reviews are **pending**. The owner previously reported native-review resources unavailable; no later reviewer evidence has been supplied.

For each source/language, record an actual reviewer or agreed attribution, review date, accepted or revised wording, source ID/fingerprint, context and any unresolved issue. Review accessible labels as spoken controls as well as visible words. In particular, check the lamp-light/parchment theme metaphors, date versus lunar-tithi terminology, and each occurrence of “Clear” before import. A shared English label can have different contexts.

Do not set a reviewer to the agent, owner or a fictional person merely to close the gate. Model self-checking is not the separately required native meaning review. Do not mark the entire batch reviewed from a single language's acceptance.

After acceptance, reuse existing `docs/assets/translations/` and phrase-matrix formats, preserve source/private protection and original data, and run the existing catalogue/protection/browser/strict-build checks. A draft's presence here never enables it on staging or production.

The 4 November structural check and unchanged-runtime translation tests are recorded in the maintenance chat. No sacred text, CWID, canonical title, database value, user data, theme, route or provider setting was changed by this batch.
