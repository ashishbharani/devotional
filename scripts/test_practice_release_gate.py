"""Assert preview inclusion AND absence from default public builds."""
from pathlib import Path
import sys

assert sys.argv[1:] in [['enabled'], ['disabled']]
enabled = sys.argv[1] == 'enabled'
site = Path(__file__).resolve().parent.parent / 'site'
home = (site / 'index.html').read_text(encoding='utf-8')
worker = (site / 'sw.js').read_text(encoding='utf-8')
for route in ('reader', 'sanctuary'):
    assert (site / route / 'index.html').exists() == enabled, route
for asset in ('stylesheets/practice.css', 'javascripts/abp-practice.js'):
    assert (asset in home) == enabled, asset
    assert (asset in worker) == enabled, asset
assert ('Enter the Devotional Sanctuary' in home) == enabled
assert 'data-panchang-view="summary"' in home, 'existing Daily Darshan must remain'
print(f'PASS practice release gate: {sys.argv[1]}')
