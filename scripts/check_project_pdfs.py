"""Verify archived source bytes and complete native information pages."""

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
# Normalised full native article text, verified against the source documents.
# The legal contact page follows its visible correction, not hidden older text.
NATIVE_TEXT_SHA = {
    "about": "eed71a977769b49ece87816230092123fc0fe8782228cd4a362eb291f4b7e75d",
    "contribution": "22e9ee675cd6674762195c19982984905b261badc75aa54174639645a9ee2040",
    "foreword": "0606595b3b750aa41dbbaa6c26355246fc7c688bc7072c9508976079602dc09a",
    "disclaimer": "4c951f0ec09d5b02f5118f0b5efb99db1fdba5c25c2315f851a83e36f5bef0e4",
}


class Page(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.links = []
        self.headings = []
        self.description = None
        self.ids = []
        self.images = []
        self.native_text = []
        self.in_article = False
        self.in_contents = False
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "article" and "abp-project-info" in attrs.get("class", ""):
            self.in_article = True
        if tag == "nav" and "abp-info-contents" in attrs.get("class", ""):
            self.in_contents = True
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "img":
            self.images.append(attrs)
        if tag == "a":
            self.links.append(attrs)
        if tag in {"h1", "h2", "h3"}:
            self.headings.append(tag)
        if tag == "meta" and attrs.get("name") == "description":
            self.description = attrs.get("content")

    def handle_endtag(self, tag):
        if tag == "article":
            self.in_article = False
        if tag == "nav":
            self.in_contents = False

    def handle_data(self, data):
        if self.in_article and not self.in_contents:
            self.native_text.append(data)


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
        native = " ".join(" ".join(page.native_text).split())
        assert sha256(native.encode()).hexdigest() == NATIVE_TEXT_SHA[route], f"native source text changed: {route}"
        assert not any(a.get("href", "").lower().endswith(".pdf") for a in page.links), f"PDF dependency: {route}"
        for image in page.images:
            if "assets/images/" not in image.get("src", ""):
                continue
            resolved = urlsplit(urljoin("https://example.test/devotional/" + route + "/", image["src"])).path
            assert resolved.startswith("/devotional/assets/images/"), resolved
            assert (ROOT / "site" / resolved.removeprefix("/devotional/")).exists(), resolved
        if route == "disclaimer":
            assert all(f"clause-{i}" in page.ids for i in range(1, 73)), "missing legal clause"
            assert len([i for i in page.ids if i.startswith("part-")]) == 18, "missing legal part"
            for anchor in ("#clause-70", "#clause-72", "#part-xviii"):
                assert any(a.get("href") == anchor for a in page.links), anchor
    contribution = (ROOT / "site/contribution/index.html").read_text(encoding="utf-8")
    for detail in ("38480100004053", "BARB0IPEDEL", "bharani.ashish@okhdfcbank", "5th character is zero (0)"):
        assert detail in contribution, f"payment detail missing: {detail}"
    for name in ("ashish-bharani-portrait.png", "contribution-phonepe-qr.png"):
        assert (ROOT / "docs/assets/images" / name).read_bytes() == (ROOT / "site/assets/images" / name).read_bytes()
    qr = ROOT / "docs/assets/images/contribution-phonepe-qr.png"
    assert sha256(qr.read_bytes()).hexdigest() == "5b39a827661cf343bef76b4847a9a99568ed5b6758128da48571358fb75b0085", "original QR image changed"
    print("Native information-page audit passed: four full HTML pages, 72 clauses / 18 parts, source archives unchanged and payment details intact")


if __name__ == "__main__":
    main()
