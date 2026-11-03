"""Export an auditable human review pack; never translate or modify the site."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

from audit_hosted_translations import CODES, FIELDS, ROOT, norm


def build_review(report, collection):
    if not isinstance(report, dict) or report.get('status') not in {'incomplete', 'requires-linguistic-and-runtime-review'} or not isinstance(report.get('backlog'), list):
        raise ValueError('Expected the hosted-text audit report')
    groups = [g for c in collection['categories'] for g in c['groups']]
    works = [w for g in groups for f in g['forms'] for w in f['works']]
    field_values = {field: {norm(w[field]) for w in works if w.get(field)} for field in FIELDS}
    categories = {norm(c['title']) for c in collection['categories']}
    sections = {norm(g['name']) for g in groups}
    brands = {'hdc', 'hdc — hindu devotional collection', 'hindu devotional collection'}
    seen, rows = set(), []
    for item in report['backlog']:
        if not isinstance(item, dict) or not {'source', 'languages', 'id', 'occurrences', 'examples'} <= item.keys():
            raise ValueError('Incomplete audit record')
        source, languages = item['source'], item['languages']
        if not isinstance(source, str) or not source.strip() or not isinstance(languages, list) or not languages or any(not isinstance(code, str) or code not in CODES for code in languages) or len(set(languages)) != len(languages):
            raise ValueError('Invalid source or missing-language list')
        if type(item['occurrences']) is not int or item['occurrences'] < 1 or not isinstance(item['examples'], list) or any(not isinstance(path, str) for path in item['examples']):
            raise ValueError('Invalid occurrence count or source examples')
        source_id = hashlib.sha256(norm(source).encode()).hexdigest()[:20]
        if item['id'] != source_id or source_id in seen:
            raise ValueError('Stale, changed or duplicate source ID')
        seen.add(source_id)
        value = norm(source)
        fields = [field for field, values in field_values.items() if value in values]
        kind = ('brand-literal-review' if value in brands else 'category-name-review' if value in categories else
                'section-name-review' if value in sections else 'catalogue-field-review' if fields else 'hosted-text-review')
        rows.append({'id': source_id, 'source': source, 'kindSuggestion': kind,
                     'catalogueFields': fields, 'occurrences': item['occurrences'], 'examples': item['examples'],
                     'missingLanguages': languages, 'reviewStatus': 'unreviewed',
                     'translations': {code: '' for code in languages}, 'reviewer': '', 'reviewNotes': ''})
    return {'schema': 1, 'status': 'unreviewed-not-imported', 'releaseEligible': False,
            'scope': 'Suggestions derive only from exact existing labels/metadata; no meaning, proper-name exemption or translation is certified.',
            'records': rows}


def spreadsheet_text(value):
    # Preserve the exact original in JSON while preventing formula execution in CSV viewers.
    return "'" + value if value.startswith(('\t', '\r', '\n')) or value.lstrip().startswith(('=', '+', '-', '@')) else value


def write_pack(report_bytes, collection_bytes, output):
    report = json.loads(report_bytes)
    catalogue_hash = hashlib.sha256(collection_bytes).hexdigest()
    inputs = report.get('inputs', {}) if isinstance(report, dict) else {}
    if inputs.get('catalogueSha256') != catalogue_hash:
        raise ValueError('Audit catalogue fingerprint missing or changed; regenerate the hosted-text audit')
    result = build_review(report, json.loads(collection_bytes))
    result['auditInputs'] = inputs
    result['auditSha256'] = hashlib.sha256(report_bytes).hexdigest()
    result['catalogueSha256'] = hashlib.sha256(collection_bytes).hexdigest()
    pack = output / hashlib.sha256(report_bytes + collection_bytes).hexdigest()[:16]
    pack.mkdir(parents=True, exist_ok=False)  # Never overwrite a maintainer's entered review.
    (pack / 'review.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    with (pack / 'review.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['id', 'source', 'kindSuggestion', 'catalogueFields', 'missingLanguages', 'occurrences', 'examples', *CODES, 'reviewer', 'reviewNotes'])
        for row in result['records']:
            cells = [row['id'], row['source'], row['kindSuggestion'], ';'.join(row['catalogueFields']),
                     ';'.join(row['missingLanguages']), row['occurrences'], ';'.join(row['examples']), *['' for _ in CODES], '', '']
            writer.writerow([spreadsheet_text(cell) if isinstance(cell, str) else cell for cell in cells])
    return pack


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audit', type=Path, default=ROOT / 'work/translation-coverage.json')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'work/translation-review')
    args = parser.parse_args()
    pack = write_pack(args.audit.read_bytes(), (ROOT / 'data/collection.json').read_bytes(), args.output_dir)
    print(f'Created unreviewed pack: {pack}. No site data changed; no translations imported.')


if __name__ == '__main__':
    main()
