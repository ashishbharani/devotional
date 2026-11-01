"""Whole-hosted-text backlog, not a dictionary-completeness or linguistic certificate.

Usage: python scripts/audit_hosted_translations.py --site site
       add --require-complete to gate any claim that all hosted text is translated.
Original sacred titles, code, entered values and named source-script text are not
automatically relabelled as translated prose. Unknown proper names remain review
candidates; this deliberately errs toward reporting rather than hiding omissions.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CODES = ("hi", "mr", "gu", "bn", "pa", "te", "kn", "ml", "ta")
FIELDS = ("language", "form", "singer", "purposes", "best_time", "jyotisha", "affliction")

def norm(text):
    return " ".join(text.split()).lower()

class Texts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.texts = []
        self.category_texts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set(attrs.get("class", "").split())
        protected = tag in ("script", "style", "svg", "code", "pre", "noscript", "input", "textarea")
        protected |= bool(classes & {"abp-work-title", "abp-work-original"}) or attrs.get("lang") == "sa"
        protected |= any(key in attrs for key in ("data-i18n", "data-i18n-value", "data-i18n-all"))
        if tag not in ("area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"):
            self.stack.append((tag, protected, attrs.get("data-category-name")))
        # Public labels on inputs are hosted text; entered values are not.
        if tag not in ("script", "style", "svg", "code", "pre", "noscript") and not (classes & {"abp-work-title", "abp-work-original"}):
            for key in ("aria-label", "title", "placeholder", "alt"):
                marker = "data-i18n-" + ("aria" if key == "aria-label" else key)
                if attrs.get(key) and marker not in attrs:
                    self.texts.append(attrs[key])

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, text):
        if not any(skip for _, skip, _ in self.stack) and sum(char.isalpha() for char in text) >= 2:
            self.texts.append(text)
            category = next((number for _, _, number in reversed(self.stack) if number), None)
            if category:
                self.category_texts.append((text, int(category) - 1))

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--site", type=Path, default=ROOT / "site")
    ap.add_argument("--output", type=Path, default=ROOT / "outputs/translation-coverage.json")
    ap.add_argument("--require-complete", action="store_true")
    args = ap.parse_args()
    data = json.loads((ROOT / "docs/assets/i18n.json").read_text(encoding="utf-8"))
    translations = defaultdict(dict)
    for section in data["sections"]:
        for index, source in enumerate(section["values"]["en"]):
            translations[norm(source)].update({code: section["values"].get(code, [])[index] for code in CODES})
    for source, values in data.get("textTranslations", {}).items():
        translations[norm(source)].update(values)
    raw = json.loads((ROOT / "data/collection.json").read_text(encoding="utf-8"))
    for category in raw["categories"]:
        index = int(category["num"]) - 1
        for code in CODES:
            names = data.get("categoryNames", {}).get(code, [])
            if index < len(names) and names[index]:
                translations[norm(category["title"])][code] = names[index]
    works = [w for c in raw["categories"] for g in c["groups"] for f in g["forms"] for w in f["works"]]
    fields = {field: Counter(w.get(field, "") for w in works if w.get(field)) for field in FIELDS}
    candidates = Counter()
    origins = defaultdict(set)
    original_sources = {}
    pages = list(args.site.rglob("*.html"))
    if not pages:
        raise SystemExit(f"No generated HTML found in {args.site}; build the site first")
    for page in pages:
        parser = Texts()
        parser.feed(page.read_text(encoding="utf-8"))
        for text, index in parser.category_texts:
            for code in CODES:
                names = data.get("categoryNames", {}).get(code, [])
                if 0 <= index < len(names) and names[index]:
                    translations[norm(text)][code] = names[index]
        for text in parser.texts:
            key = norm(text)
            if sum(char.isalpha() for char in key) < 2:
                continue
            candidates[key] += 1
            original_sources.setdefault(key, " ".join(text.split()))
            if len(origins[key]) < 5:
                origins[key].add(page.relative_to(args.site).as_posix())
    report = {
        "status": "incomplete",
        "scope": "Hosted HTML text/attributes and every canonical catalogue metadata field, excluding sacred work titles/code. Unknown proper names require review. Runtime-only message variants and translation quality also require browser/native-language review.",
        "pages": len(pages), "canonicalRows": len(works), "uniqueHostedCandidates": len(candidates),
        "languages": {}, "backlog": [],
    }
    missing_languages = defaultdict(list)
    for code in CODES:
        missing = [key for key in candidates if not translations.get(key, {}).get(code)]
        report["languages"][code] = {
            "hostedCandidatesMissing": len(missing),
            "catalogue": {field: {"unique": len(counts), "translatedUnique": sum(bool(translations.get(norm(source), {}).get(code)) for source in counts), "rowsWithTranslation": sum(count for source, count in counts.items() if translations.get(norm(source), {}).get(code))} for field, counts in fields.items()},
        }
        for key in missing:
            missing_languages[key].append(code)
    for key, languages in missing_languages.items():
        report["backlog"].append({"languages": languages, "id": hashlib.sha256(key.encode()).hexdigest()[:20], "source": original_sources[key], "occurrences": candidates[key], "examples": sorted(origins[key])})
    if not report["backlog"]:
        report["status"] = "requires-linguistic-and-runtime-review"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "backlog"}, ensure_ascii=False, indent=2))
    return 1 if args.require_complete and report["backlog"] else 0

if __name__ == "__main__":
    raise SystemExit(main())
