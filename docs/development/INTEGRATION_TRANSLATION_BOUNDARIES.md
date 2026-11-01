# Local translation integration preservation

Production main `255fe71` was merged into the release branch at `599d481`,
preserving PR52's approved header treatment, PR53's maskable icon and PR54's
local translation rework/removal of Google Website Translator. No provider is
reintroduced. Whole-hosted-text translation remains incomplete as documented in
TRANSLATION_REWORK.md; registered-key tests cannot certify that completion.

## Confirmed boundary defect

The implicit phrase walker did not exclude `translate="no"` or `.notranslate`.
A focused reproduction used the actual merged module/catalogue via explicitly
declared development-only response overrides. A protected source paragraph
containing the synthetic text `Moonrise` changed to Tamil `சந்திரோதயம்`, causing
the unchanged-source assertion to fail. This was not a claim about actual user
notes or an external provider. The same reproduction passed after adding the
two exclusions to the existing protected-selector list.

The repair covers both implicit text and accessible-attribute translation. It
preserves input/textarea values, explicitly protected saved-option labels and
source quotations. Explicit authored `data-i18n` interface labels/attributes
still translate inside a protected form; those passes are intentionally retained.
Existing work-title, original-language and proper-identity protection and title
transliteration remain unchanged. No dictionary content, saved records or search
algorithm is changed by this repair.

## Integrated regression scope

The existing local-translation browser suite retains its original ten-language,
three-width, dynamic-source restoration, route, icon and privacy assertions.
Additional cases cover both exclusion markers, dynamic protected text, saved
option text/value, private input/textarea values and explicit localized labels.
The actual historical English Reader paragraph is checked across ten language
choices against a deliberately matching test-only dictionary phrase. That fixture
is injected only by the test, never placed in the production catalogue.

The finite local runner now has 42 steps, adding the two upstream CI checks:
`test_local_translation_catalogue.py` and `audit_hosted_translations.py --output
work/translation-coverage.json`. The latter reports coverage without pretending
the backlog is translated. Its separate `--require-complete` mode is a release
completion gate; do not weaken it or turn unregistered text into fake translations.

Full validation of the committed integrated candidate is still required. Inspect
the generated validation record for exact commit, dirty status, all 42 exit codes
and protected before/after hashes. Passing automated tests does not certify native
language meaning, physical devices, authenticated accounts or field performance.
The empty human-reviewed festival registry, large hosted-text translation backlog
and final coordinated staging approval remain deployment gates.
