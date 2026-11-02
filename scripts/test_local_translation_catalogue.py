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
with patch.object(Path, 'read_text', return_value=json.dumps(damaged, ensure_ascii=False)):
    _, errors = audit_catalogue(Path('in-memory-catalogue.json'))
    assert any('ta: missing hosted-text' in error for error in errors)
print('PASS local catalogue: ten languages, complete registered phrase matrices, missing values fail; no Google Translate offers')
