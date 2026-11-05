"""Review export integrity; synthetic fixtures are never production translations."""
import copy
import csv
import hashlib
import json
from pathlib import Path
import uuid

from audit_hosted_translations import ROOT, norm
from export_translation_review import build_review, write_pack


def entry(source):
    return {'id': hashlib.sha256(norm(source).encode()).hexdigest()[:20], 'source': source,
            'languages': ['hi', 'ta'], 'occurrences': 2, 'examples': ['example/index.html']}


collection = {'categories': [{'title': 'Sample Category', 'groups': [{'name': 'Known Section', 'forms': [
    {'works': [{'purposes': 'devotional reading'}]}]}]}]}
report = {'status': 'incomplete', 'backlog': [entry(source) for source in
          ['HDC', 'Sample Category', 'Known Section', 'devotional reading', 'नमस्ते', '=SUM(A1)']]}
before = copy.deepcopy((report, collection))
result = build_review(report, collection)
assert not result['releaseEligible'] and result['status'] == 'unreviewed-not-imported'
assert [row['kindSuggestion'] for row in result['records']] == [
    'brand-literal-review', 'category-name-review', 'section-name-review',
    'catalogue-field-review', 'hosted-text-review', 'hosted-text-review']
assert all(row['reviewStatus'] == 'unreviewed' and row['translations'] == {'hi': '', 'ta': ''}
           for row in result['records'])
assert (report, collection) == before, 'classification must never mutate the audit or catalogue'
for damage in ['source', 'duplicate', 'language', 'claimed-complete', 'occurrences', 'examples', 'record']:
    broken = copy.deepcopy(report)
    if damage == 'record': broken['backlog'][0] = None
    if damage == 'source': broken['backlog'][0]['source'] = 'Changed source'
    if damage == 'duplicate': broken['backlog'].append(copy.deepcopy(broken['backlog'][0]))
    if damage == 'language': broken['backlog'][0]['languages'] = ['unknown']
    if damage == 'claimed-complete': broken['status'] = 'complete'
    if damage == 'occurrences': broken['backlog'][0]['occurrences'] = '=1+1'
    if damage == 'examples': broken['backlog'][0]['examples'] = ['example/index.html', None]
    try:
        build_review(broken, collection)
    except ValueError:
        pass
    else:
        raise AssertionError('invalid/stale review input accepted: ' + damage)
output = ROOT / 'work/translation-review-tests' / uuid.uuid4().hex
raw_collection = json.dumps(collection, ensure_ascii=False).encode()
report['inputs'] = {'catalogueSha256': hashlib.sha256(raw_collection).hexdigest()}
raw_report = json.dumps(report, ensure_ascii=False).encode()
pack = write_pack(raw_report, raw_collection, output)
document = json.loads((pack / 'review.json').read_text(encoding='utf-8'))
assert document['records'][4]['source'] == 'नमस्ते'
assert document['catalogueSha256'] == hashlib.sha256(raw_collection).hexdigest()
with (pack / 'review.csv').open(encoding='utf-8-sig', newline='') as stream:
    rows = list(csv.DictReader(stream))
assert rows[-1]['source'] == "'=SUM(A1)", 'CSV must not execute a source value as a formula'
assert document['records'][-1]['source'] == '=SUM(A1)', 'JSON retains the exact source'
assert all(row['hi'] == '' and row['ta'] == '' for row in rows)
(pack / 'review.json').write_text('Synthetic entered reviewer work — preserve', encoding='utf-8')
try:
    write_pack(raw_report, raw_collection, output)
except FileExistsError:
    pass
else:
    raise AssertionError('export overwrote existing entered review')
assert (pack / 'review.json').read_text(encoding='utf-8') == 'Synthetic entered reviewer work — preserve'
for changed in [raw_collection + b' ', b'{}']:
    try:
        write_pack(raw_report, changed, output / 'stale')
    except ValueError:
        pass
    else:
        raise AssertionError('stale catalogue accepted as current audit provenance')
assert not (output / 'stale').exists(), 'invalid inputs must not create a partial review pack'
from export_translation_review import spreadsheet_text
for text in ['=SUM(A1)', ' +1', '-1', '@SUM(A1)', '\ttext', '\rtext', '\ntext']:
    assert spreadsheet_text(text) == "'" + text
print('PASS exact-source review IDs, metadata-only suggestions, blank translations, Unicode/CSV safety and no-overwrite review preservation')

# Exercise the actual audit entry point on isolated public fixtures. Missing text
# must still fail the opt-in completeness gate; export metadata is not a waiver.
import contextlib
import io
import sys
from unittest.mock import patch
import audit_hosted_translations as audit
fixture = output / 'audit-fixture'
for folder in ['data', 'docs/assets', 'site']:
    (fixture / folder).mkdir(parents=True, exist_ok=True)
source = copy.deepcopy(collection)
source['categories'][0]['num'] = 1
(fixture / 'data/collection.json').write_text(json.dumps(source), encoding='utf-8')
(fixture / 'docs/assets/i18n.json').write_text('{"sections":[]}', encoding='utf-8')
(fixture / 'site/index.html').write_text('<p>Untranslated public label</p>', encoding='utf-8')
target = fixture / 'audit.json'
with patch.object(audit, 'ROOT', fixture), patch.object(sys, 'argv', ['audit', '--site', str(fixture / 'site'), '--output', str(target), '--require-complete']), contextlib.redirect_stdout(io.StringIO()):
    assert audit.main() == 1, 'review export must not weaken the incomplete-translation gate'
document = json.loads(target.read_text(encoding='utf-8'))
assert document['inputs']['catalogueSha256'] == hashlib.sha256((fixture / 'data/collection.json').read_bytes()).hexdigest()
assert document['inputs']['i18nSha256'] == hashlib.sha256((fixture / 'docs/assets/i18n.json').read_bytes()).hexdigest()
assert document['status'] == 'incomplete' and document['backlog']
missing = {item['source']: set(item['languages']) for item in document['backlog']}
for value in ['Untranslated public label', 'Sample Category', 'Known Section', 'devotional reading']:
    assert value in missing and missing[value] == set(audit.CODES), (
        'the completion gate must include dynamically rendered catalogue fields '
        'and hierarchy labels, not just the HTML text inventory: ' + value
    )
assert document['uniqueHostedCandidates'] == 1
assert document['uniqueCatalogueCandidates'] >= 3
assert all(document['languages'][code]['catalogueCandidatesMissing'] >= 3 for code in audit.CODES)
exported = write_pack(target.read_bytes(), (fixture / 'data/collection.json').read_bytes(), fixture / 'review')
assert json.loads((exported / 'review.json').read_text(encoding='utf-8'))['releaseEligible'] is False
print('PASS real audit fingerprints, incomplete release gate and isolated export handoff')
