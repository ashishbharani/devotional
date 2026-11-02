"""Validate local phrase matrices and the honest all-text release gate."""
import copy
import json
from pathlib import Path
import sys
from unittest.mock import patch

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from scripts.check_i18n import audit_catalogue
data = json.loads((root / 'docs/assets/i18n.json').read_text(encoding='utf-8'))
assert len(data['localeNames']) == 10
assert not any('Google Translate' in str(section) for section in data['sections'])
for source, values in data['textTranslations'].items():
    assert set(values) == set(data['localeNames']) - {'en'}, source
    assert all(isinstance(value, str) and value.strip() for value in values.values())
damaged = copy.deepcopy(data)
del damaged['textTranslations']['Moonrise']['ta']
real_read = Path.read_text
catalogue_path = root / 'docs/assets/i18n.json'

def audit_fixture(catalogue=None, pack=None):
    def read_fixture(path, *args, **kwargs):
        if path == catalogue_path and catalogue is not None:
            return json.dumps(catalogue, ensure_ascii=False)
        if path == catalogue_path.parent / 'translations/hi.json' and pack is not None:
            return json.dumps(pack, ensure_ascii=False)
        return real_read(path, *args, **kwargs)
    with patch.object(Path, 'read_text', read_fixture):
        return audit_catalogue(catalogue_path)[1]

assert any('ta: missing hosted-text' in error for error in audit_fixture(catalogue=damaged))
assert audit_fixture() == []
damaged = copy.deepcopy(data)
damaged['contentCatalogues']['hi'] = 'https://untrusted.example/hi.json'
assert any('local content catalogue must use' in error for error in audit_fixture(catalogue=damaged))
for pack in [[], {'language': 'mr', 'translations': {}}, {'language': 'hi', 'translations': []}]:
    assert any('structure/language' in error for error in audit_fixture(pack=pack))
for translations, message in [
    ({'Unchanged source': 'Unchanged source'}, 'unchanged source'),
    ({'Example': ''}, 'empty/duplicate'),
    ({'Example': 'उदाहरण', ' EXAMPLE ': 'नमूना'}, 'empty/duplicate'),
]:
    assert any(message in error for error in audit_fixture(pack={'language':'hi','translations':translations}))
print('PASS local catalogue: ten languages, complete registered phrase matrices, missing values fail; no Google Translate offers')
print('PASS content packs: wrong paths, wrong language, malformed values, unchanged prose and normalized duplicate keys rejected')

hi = json.loads((root / 'docs/assets/translations/hi.json').read_text(encoding='utf-8'))['translations']
collection = json.loads((root / 'data/collection.json').read_text(encoding='utf-8'))
works = [work for category in collection['categories'] for group in category['groups'] for form in group['forms'] for work in form['works']]
for field, expected_count in [('best_time', 13), ('jyotisha', 10), ('affliction', 9)]:
    sources = {work[field] for work in works if work.get(field)}
    assert len(sources) == expected_count, f'{field}: source changed; review translation coverage'
    assert sources <= hi.keys(), f'{field}: missing Hindi source descriptors'
    for source in sources:
        if 'individual' in source or 'horoscope-specific' in source:
            assert 'मूल्यांकन' in hi[source], f'{field}: retain the individual-assessment qualification'
print('PASS Hindi catalogue: all current timing/Jyotisha/affliction descriptors registered; assessment qualifications retained')
