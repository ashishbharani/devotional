"""Verify official PDF bytes, HTML notices and Pages-safe links after a build."""

from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from check_site import ROUTES

ROOT = Path(__file__).resolve().parent.parent
PDFS = {
    "about-me": "298735e925aa98b5b32e160137fb3d36a3218ccb23c1e21a3646693840062fe1",
    "contribution": "a7b105491f052db9a19ec8646b8dd6e39a8fd9b03c49930c78e914c75fdb932d",
    "disclaimer": "3f798f66fc9954f875aa438e788497373b1a2021bba6b72e2d0f7723cd416fed",
    "foreword": "36517e5dfde0528206016671924328af45fd3d48de567a9f66a2ab14b60c6dad",
}


class Page(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.links = []
        self.headings = []
        self.description = None
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.links.append(attrs)
        if tag in {"h1", "h2", "h3"}:
            self.headings.append(tag)
        if tag == "meta" and attrs.get("name") == "description":
            self.description = attrs.get("content")


def main():
    for route in (*ROUTES, "about", "contribution"):
        content = (ROOT / "site" / route / "index.html").read_text(encoding="utf-8")
        assert content.count('aria-label="About this project"') == 1, f"missing/duplicate footer: {route}"
    for name, expected in PDFS.items():
        for directory in ("docs", "site"):
            file = ROOT / directory / "assets" / "pdfs" / f"{name}.pdf"
            assert sha256(file.read_bytes()).hexdigest() == expected, f"altered PDF: {file}"
        route = "about" if name == "about-me" else name
        page = Page((ROOT / "site" / route / "index.html").read_text(encoding="utf-8"))
        assert page.headings.count("h1") == 1, route
        assert page.description, f"missing description: {route}"
        pdf_links = [a for a in page.links if a.get("href", "").endswith(f"/{name}.pdf")]
        assert pdf_links, f"missing PDF link: {route}"
        for link in pdf_links:
            for base in ("http://localhost/", "https://example.test/devotional/"):
                resolved = urlsplit(urljoin(base + route + "/", link["href"])).path
                assert resolved == urlsplit(base).path + f"assets/pdfs/{name}.pdf", resolved
            assert link.get("target") == "_blank" and "noopener" in link.get("rel", ""), route
    print("Official PDF audit passed: all four originals unchanged, copied, linked and described")


if __name__ == "__main__":
    main()
