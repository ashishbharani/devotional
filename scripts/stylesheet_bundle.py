"""Preview-only delivery of unchanged, ordered local CSS as one cacheable asset."""
import hashlib
import json
import posixpath
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

LINK = re.compile(r'<link\b[^>]*>', re.I)
CSS_URL = re.compile(r'url\(\s*(?:([\'"])(.*?)\1|([^)]*?))\s*\)', re.I | re.S)


class Link(HTMLParser):
    def handle_starttag(self, tag, attrs):
        self.attrs = dict(attrs)


def local_styles(text, directory, site_path='/'):
    found = []
    for match in LINK.finditer(text):
        parser = Link()
        parser.feed(match.group())
        attrs = parser.attrs
        if attrs.get('rel') != 'stylesheet':
            continue
        href = urlsplit(attrs.get('href', ''))
        if href.scheme or href.netloc:
            continue
        if attrs.get('media') or attrs.get('title') or 'disabled' in attrs:
            raise ValueError('Conditional local stylesheet cannot be bundled')
        if href.path.startswith('/'):
            if not href.path.startswith(site_path):
                raise ValueError('Stylesheet outside site scope')
            name = posixpath.normpath(href.path[len(site_path):])
        else:
            name = posixpath.normpath(posixpath.join(directory, href.path))
        if name.startswith('../') or href.query or href.fragment:
            raise ValueError('Unsupported local stylesheet address')
        found.append((match, name))
    return found


def rebase_css(css, source):
    def replace(match):
        value = match.group(2) if match.group(1) else match.group(3)
        url = urlsplit(value)
        if not value or value.startswith(('/', '#')) or url.scheme or url.netloc:
            return match.group()
        destination = posixpath.normpath(posixpath.join(posixpath.dirname(source), url.path))
        relative = posixpath.relpath(destination, 'stylesheets')
        return 'url("' + relative + ('?' + url.query if url.query else '') + ('#' + url.fragment if url.fragment else '') + '")'
    return CSS_URL.sub(replace, css)


def publish_bundle(site, site_path='/'):
    """Keep original files/URLs; fail closed if a page has a different cascade."""
    home = (site / 'index.html').read_text(encoding='utf-8')
    names = [name for _, name in local_styles(home, '', site_path)]
    if not names or len(names) != len(set(names)):
        raise ValueError('Missing or repeated global stylesheet')
    sources, parts = [], []
    for name in names:
        raw = (site / name).read_bytes()
        if re.search(r'@import\b', raw.decode('utf-8'), re.I):
            raise ValueError('Imported stylesheet requires explicit delivery review: ' + name)
        sources.append({'path': name, 'sha256': hashlib.sha256(raw).hexdigest()})
        parts.append(rebase_css(raw.decode('utf-8'), name))
    content = '\n'.join(parts).encode('utf-8')
    bundle = 'stylesheets/hdc-preview-' + hashlib.sha256(content).hexdigest()[:16] + '.css'
    (site / bundle).write_bytes(content)
    for target in sorted(site.rglob('*.html')):
        text = target.read_text(encoding='utf-8')
        directory = target.parent.relative_to(site).as_posix()
        links = local_styles(text, directory, site_path)
        if [name for _, name in links] != names:
            raise ValueError('Unexpected stylesheet cascade: ' + target.relative_to(site).as_posix())
        first = links[0][0].start()
        # Material's 404 uses root-absolute assets: preserve those semantics when
        # the error document is served at an arbitrary missing nested address.
        absolute = re.search(r'href=[\'"]/', links[0][0].group())
        href = site_path + bundle if absolute else posixpath.relpath(bundle, directory)
        replacements = {match.start(): (match.end(), '<link rel="stylesheet" href="' + href + '">' if match.start() == first else '') for match, _ in links}
        for start, (end, replacement) in sorted(replacements.items(), reverse=True):
            text = text[:start] + replacement + text[end:]
        target.write_text(text, encoding='utf-8')
    manifest = {'schema': 1, 'bundle': bundle, 'sitePath': site_path, 'bytes': len(content), 'sources': sources}
    (site / 'assets' / 'stylesheet-bundle.json').write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')
    return bundle
