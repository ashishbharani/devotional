"""Inventory every built route, bookmark, link and asset for header staging QA."""
from __future__ import annotations
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = "https://ashishbharani.github.io/devotional/"


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.links = set(), []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        for attr in ("href", "src", "action"):
            if values.get(attr):
                self.links.append(values[attr])
        for src in values.get("srcset", "").split(","):
            if src.strip():
                self.links.append(src.strip().split()[0])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    site = ROOT / "site"
    routes, ids, sources = [], {}, []
    for file in sorted(site.rglob("*.html")):
        relative = file.relative_to(site).as_posix()
        route = relative[:-10] if relative.endswith("index.html") else relative
        routes.append(route)
        page = Page(file.read_text(encoding="utf-8"))
        ids[route] = sorted(page.ids)
        sources.extend((route, link) for link in page.links)
    for file in sorted((site / "stylesheets").glob("*.css")):
        relative = file.relative_to(site).as_posix()
        sources.extend((relative, value.strip("\"' ")) for value in re.findall(r"url\(([^)]+)\)", file.read_text(encoding="utf-8")))
    manifest = json.loads((site / "manifest.webmanifest").read_text(encoding="utf-8"))
    sources.extend(("manifest.webmanifest", icon["src"]) for icon in manifest["icons"])
    internal, external, missing = set(), set(), set()
    for source, link in sources:
        if link.startswith("data:"):
            continue
        url = urlsplit(urljoin(PUBLIC + source, link))
        if url.scheme not in ("http", "https") or url.netloc != "ashishbharani.github.io":
            external.add(url.geturl())
            continue
        if not url.path.startswith("/devotional/"):
            missing.add((source, link, "outside Pages subdirectory"))
            continue
        target = unquote(url.path[len("/devotional/"):])
        internal.add(target + ("#" + url.fragment if url.fragment else ""))
        file = site / target
        if file.is_dir():
            file = file / "index.html"
        if not file.is_file():
            missing.add((source, link, "missing file"))
        elif url.fragment and file.suffix == ".html" and unquote(url.fragment) not in ids.get(target, []):
            # Directory routes and explicit index.html refer to the same IDs.
            key = target[:-10] if target.endswith("index.html") else target
            if unquote(url.fragment) not in ids.get(key, []):
                missing.add((source, link, "missing bookmark"))
    protected = ["data/collection.json", "data/search-registry.json", "docs/javascripts/abp-firebase-config.js", "firestore.rules"]
    result = {"routes": routes, "bookmarks": ids, "internalDestinations": sorted(internal),
              "externalDestinations": sorted(external), "existingLinkIssues": sorted(missing),
              "protectedSHA256": {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in protected}}
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"routes":len(routes), "bookmarks":sum(map(len, ids.values())),
                      "internalDestinations":len(internal), "externalDestinations":len(external),
                      "existingLinkIssues":len(missing), "output":str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
