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
bundle_file = site / 'assets/stylesheet-bundle.json'
assert bundle_file.exists() == enabled
bundled = json.loads(bundle_file.read_text(encoding='utf-8')) if enabled else {'sources': []}
if enabled:
    assert bundled['bundle'] in home and bundled['bundle'] in shell
    assert (site / bundled['bundle']).is_file()
for route in ('reader', 'sanctuary', 'journeys', 'explore'):
    assert (site / route / 'index.html').exists() == enabled, route
for asset in ('javascripts/abp-local-state.js', 'stylesheets/practice.css', 'javascripts/abp-practice.js', 'stylesheets/festivals.css', 'javascripts/abp-festivals.js', 'javascripts/abp-journeys.js', 'javascripts/abp-discovery.js', 'javascripts/abp-sharing.js', 'javascripts/abp-japa-history.js', 'javascripts/abp-section-shortcuts.js'):
    if asset.startswith('stylesheets/'):
        assert (asset in [item['path'] for item in bundled['sources']]) == enabled, asset
    else:
        assert (asset in home) == enabled, asset
    assert (asset in worker) == enabled, asset
assert ('assets/festivals/themes.mjs' in worker) == enabled
assert ('Enter the Devotional Sanctuary' in home) == enabled
assert ('data-festival-experience' in home) == enabled
assert ('data-share-page' in home) == enabled
assert ('data-daily-reader' in home) == enabled
for minutes in (5,10,20):
    assert (f'sanctuary/?minutes={minutes}' in worker) == enabled
for asset in ('sitemap.xml', 'search/search_index.json'):
    assert (asset in shell) == enabled, asset
assert 'assets/i18n.json' in shell, 'PR56 base interface dictionary is available offline in both build modes'
for code in ('hi', 'mr', 'gu', 'bn', 'pa', 'te', 'kn', 'ml', 'ta'):
    assert f'assets/translations/{code}.json' not in shell, 'full language packs remain selected-language, on-demand assets'
assert any(asset.startswith('assets/javascripts/workers/search.') for asset in shell) == enabled
assert 'assets/works-index.json' not in shell and 'assets/universal-search.json' not in shell, 'large universal payload pair remains on demand'
assert 'data-panchang-view="summary"' in home, 'existing Daily Darshan must remain'
japa = (site / 'japa-counter/index.html').read_text(encoding='utf-8')
assert ('data-japa-history-enabled' in japa) == enabled
assert ('data-japa-history' in japa) == enabled
assert ('japa-counter/' in shell) == enabled
registry = site / 'assets/section-shortcuts.json'
assert registry.exists() == enabled
assert 'assets/section-shortcuts.json' not in shell, 'section metadata remains on demand'
category = next((site / 'categories').glob('*/index.html')).read_text(encoding='utf-8')
assert ('data-section-shortcut-control' in category) == enabled
if enabled:
    assert 'data-section-shortcut-list' in (site / 'journeys/index.html').read_text(encoding='utf-8')
print(f'PASS practice release gate: {sys.argv[1]}')
