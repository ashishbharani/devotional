"""Guard the PR merge boundary between retired V1 controls and gated V2."""
from html.parser import HTMLParser
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parents[1]
template = Environment(loader=FileSystemLoader(ROOT / "theme")).get_template("partials/festival-experience.html")


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.starts, self.ends = [], []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.starts.append((tag, dict(attrs)))

    def handle_endtag(self, tag):
        self.ends.append(tag)


for practice, living in [(False, False), (True, False), (True, True)]:
    html = template.render(config={"extra": {"hdc_practice_preview": practice, "hdc_living_festival_preview": living}})
    elements = Elements(html)
    asides = [attrs for tag, attrs in elements.starts if tag == "aside"]
    assert len(asides) == int(practice), "exactly one engine or no engine; never duplicated wrappers"
    assert elements.ends.count("aside") == len(asides)
    assert sum(tag == "details" for tag, _ in elements.starts) == elements.ends.count("details")
    assert "Festival appearance (preview)" not in html, "the retired V1 public controls must stay retired"
    if living:
        assert "data-living-festival" in asides[0] and "data-festival-experience" not in asides[0]
    elif practice:
        assert "data-festival-experience" in asides[0]
        assert any(tag == "div" and "hidden" in attrs and "data-festival-settings" in attrs for tag, attrs in elements.starts)
    else:
        assert not html.strip()
print("PASS balanced festival partial: disabled, current production V1 and independent V2; no duplicate or retired public controls")
