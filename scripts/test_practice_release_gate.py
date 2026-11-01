"""Assert preview inclusion AND absence from default public builds."""
from pathlib import Path
import sys
import json
import re

assert sys.argv[1:] in [['enabled'], ['disabled']]
enabled = sys.argv[1] == 'enabled'
site = Path(__file__).resolve().parent.parent / 'site'
home = (site / 'index.html').read_text(encoding='utf-8')
worker = (site / 'sw.js').read_text(encoding='utf-8')
shell = json.loads(re.search(r'^const SHELL = (.+);', worker, re.MULTILINE).group(1))
for route in ('reader', 'sanctuary', 'journeys', 'explore'):
    assert (site / route / 'index.html').exists() == enabled, route
for asset in ('stylesheets/practice.css', 'javascripts/abp-practice.js', 'stylesheets/festivals.css', 'javascripts/abp-festivals.js', 'javascripts/abp-journeys.js', 'javascripts/abp-discovery.js', 'javascripts/abp-sharing.js'):
    assert (asset in home) == enabled, asset
    assert (asset in worker) == enabled, asset
assert ('assets/festivals/themes.mjs' in worker) == enabled
assert ('Enter the Devotional Sanctuary' in home) == enabled
assert ('data-festival-experience' in home) == enabled
assert ('data-share-page' in home) == enabled
assert ('data-daily-reader' in home) == enabled
for minutes in (5,10,20):
    assert (f'sanctuary/?minutes={minutes}' in worker) == enabled
for asset in ('sitemap.xml', 'assets/i18n.json', 'search/search_index.json'):
    assert (asset in shell) == enabled, asset
assert any(asset.startswith('assets/javascripts/workers/search.') for asset in shell) == enabled
assert 'assets/works-index.json' not in shell and 'assets/universal-search.json' not in shell, 'large universal payload pair remains on demand'
assert 'data-panchang-view="summary"' in home, 'existing Daily Darshan must remain'
print(f'PASS practice release gate: {sys.argv[1]}')
