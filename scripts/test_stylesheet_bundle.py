"""Delivery equivalence, URL compatibility and exact generated cascade audit."""
import hashlib
import json
from pathlib import Path
import tempfile
from stylesheet_bundle import local_styles, publish_bundle, rebase_css

assert rebase_css('a{background:url("../images/a.webp?v=2#x")}', 'assets/stylesheets/main.css') == 'a{background:url("../assets/images/a.webp?v=2#x")}'
for value in ('data:image/svg+xml,%3Csvg%3E', 'https://example.org/a.svg', '/devotional/a.svg', '#mark'):
    original = 'a{background:url("' + value + '")}'
    assert rebase_css(original, 'stylesheets/a.css') == original
temp_root = Path(__file__).resolve().parent.parent / 'work' / 'stylesheet-bundle-tests'
temp_root.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=temp_root) as directory:
    root = Path(directory).resolve()
    assert root.is_relative_to(temp_root.resolve())
    for name in ('stylesheets', 'assets', 'nested'):
        (root / name).mkdir()
    (root / 'stylesheets/a.css').write_text('a{color:red}', encoding='utf-8')
    (root / 'stylesheets/b.css').write_text('a{color:gold}', encoding='utf-8')
    links = '<link rel="stylesheet" href="stylesheets/a.css"><link rel="stylesheet" href="stylesheets/b.css"><link rel="stylesheet" href="https://example.org/font.css">'
    (root / 'index.html').write_text(links, encoding='utf-8')
    (root / 'nested/index.html').write_text(links.replace('href="stylesheets/', 'href="../stylesheets/'), encoding='utf-8')
    (root / '404.html').write_text(links.replace('href="stylesheets/', 'href="/devotional/stylesheets/'), encoding='utf-8')
    bundle = publish_bundle(root, '/devotional/')
    assert 'href="/devotional/' + bundle + '"' in (root / '404.html').read_text(encoding='utf-8')
    assert (root / bundle).read_text(encoding='utf-8') == 'a{color:red}\na{color:gold}'
    assert 'https://example.org/font.css' in (root / 'index.html').read_text(encoding='utf-8')
    assert [name for _, name in local_styles((root / 'nested/index.html').read_text(encoding='utf-8'), 'nested')] == [bundle]
    assert (root / 'stylesheets/a.css').read_text(encoding='utf-8') == 'a{color:red}'
    manifest = json.loads((root / 'assets/stylesheet-bundle.json').read_text(encoding='utf-8'))
    assert [item['path'] for item in manifest['sources']] == ['stylesheets/a.css', 'stylesheets/b.css']
    assert manifest['sources'][0]['sha256'] == hashlib.sha256(b'a{color:red}').hexdigest()
    (root / 'index.html').write_text(links, encoding='utf-8')
    (root / 'nested/index.html').write_text('<link rel="stylesheet" href="../stylesheets/b.css">', encoding='utf-8')
    try:
        (root / '404.html').unlink()
        publish_bundle(root)
        raise AssertionError('Different cascade must not be silently reordered')
    except ValueError as error:
        assert 'cascade' in str(error)
site = Path(__file__).resolve().parent.parent / 'site'
manifest_file = site / 'assets/stylesheet-bundle.json'
if manifest_file.exists():
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    content = (site / manifest['bundle']).read_bytes()
    assert hashlib.sha256(content).hexdigest()[:16] in manifest['bundle']
    expected = '\n'.join(rebase_css((site / item['path']).read_text(encoding='utf-8'), item['path']) for item in manifest['sources'])
    assert content == expected.encode('utf-8')
    for item in manifest['sources']:
        assert hashlib.sha256((site / item['path']).read_bytes()).hexdigest() == item['sha256']
    for target in site.rglob('*.html'):
        styles = local_styles(target.read_text(encoding='utf-8'), target.parent.relative_to(site).as_posix(), manifest['sitePath'])
        assert [name for _, name in styles] == [manifest['bundle']], target
print('PASS stylesheet delivery: original bytes/order, rebased paths, nested links, external fonts, cascade guards and generated audit')
