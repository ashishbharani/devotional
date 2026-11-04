"""Reproduce original-language Reader books from separately downloaded pinned inputs.

No network during builds; no translation/commentary fields are imported.
Usage: python scripts/import_reader_books.py --source-dir work/reader-books-source
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GITA = "c6fce39595445768876ddbb8d1268a9c935e1d2b"
MANAS = "a8734282b3f95648032a53447f08ad77acb2ecd4"
SUPPLEMENT = "96b3bafd47ffbfe1902f3f0ef7a1928dd43c34d7"
GITA_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78]
KANDAS = [
    ("balkanda", "बालकाण्ड", "1_बाल_काण्ड_data.json", 361),
    ("ayodhyakanda", "अयोध्याकाण्ड", "2_अयोध्या_काण्ड_data.json", 326),
    ("aranyakanda", "अरण्यकाण्ड", "3_अरण्य_काण्ड_data.json", 46),
    ("kishkindhakanda", "किष्किन्धाकाण्ड", "4_किष्किन्धा_काण्ड_data.json", 30),
    ("sundarkanda", "सुन्दरकाण्ड", "5_सुंदर_काण्ड_data.json", 60),
    ("lankakanda", "लङ्काकाण्ड", "6_लंका_काण्ड_data.json", 121),
    ("uttarakanda", "उत्तरकाण्ड", "7_उत्तर_काण्ड_data.json", 130),
]


def text(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Missing original text")
    # The primary Manas JSON encodes literal backslash-r/backslash-n sequences.
    return value.replace("\\r\\n", "\n").replace("\r\n", "\n").strip()


def build(source):
    fingerprints = {}

    def read(name):
        raw = (source / name).read_bytes()
        fingerprints[name] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    verses = read("gita-verse.json")
    if len(verses) != sum(GITA_COUNTS):
        raise ValueError("Changed Gita witness: inspect before import")
    gita = {"schema": 1, "id": "bhagavad-gita", "title": "Bhagavad Gita", "language": "sa", "license": "Unlicense", "chapters": []}
    for chapter, count in enumerate(GITA_COUNTS, 1):
        rows = [v for v in verses if v["chapter_number"] == chapter]
        if [v["verse_number"] for v in rows] != list(range(1, count + 1)):
            raise ValueError(f"Noncontiguous Gita chapter {chapter}")
        gita["chapters"].append({"number": chapter, "title": f"Chapter {chapter}", "passages": [
            {"id": f"gita-{chapter}-{v['verse_number']}", "label": f"Bhagavad Gita {chapter}.{v['verse_number']}", "text": text(v["text"])} for v in rows
        ]})
    manas = {"schema": 1, "id": "ramcharitmanas", "title": "Ramcharitmanas", "language": "awa", "license": "ODbL-1.0 (assembled database); public-domain underlying text; Unlicense primary dataset", "chapters": []}
    for number, (filename, title, supplement, count) in enumerate(KANDAS, 1):
        rows = read(filename + ".json")
        opening = read("dharmic-" + supplement)
        if len(rows) != count:
            raise ValueError(f"Changed Manas witness: {filename}")
        start = next(i for i, row in enumerate(opening) if row["type"] == "चौपाई")
        if start != (1 if number == 5 else 2) or opening[0]["type"] != "श्लोक":
            raise ValueError(f"Changed opening structure: {filename}")
        # Supplement only the invocations before the first chaupai. This second
        # dataset omits terminal units; it must not replace the primary body.
        passages = [{"id": f"manas-{number}-opening-{i}", "label": f"{title} · मंगलाचरण {i}", "text": text(row["content"]), "language": "sa" if row["type"] == "श्लोक" else "awa", "witness": "opening-supplement"} for i, row in enumerate(opening[:start], 1)]
        passages.extend({"id": f"manas-{number}-{i}", "label": f"{title} · पाठ-अंश {i}", "text": text(row["content"]), "witness": "primary"} for i, row in enumerate(rows, 1))
        manas["chapters"].append({"number": number, "title": title, "passages": passages})
    return [gita, manas], fingerprints


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    books, inputs = build(args.source_dir)
    target = ROOT / "data" / "reader-books"
    target.mkdir(parents=True, exist_ok=True)
    outputs = {}
    for book in books:
        raw = (json.dumps(book, ensure_ascii=False, indent=2) + "\n").encode()
        (target / (book["id"] + ".json")).write_bytes(raw)
        outputs[book["id"] + ".json"] = hashlib.sha256(raw).hexdigest()
    for source_name, output_name in [("gita-LICENSE", "GITA-UNLICENSE.txt"), ("LICENSE", "MANAS-UNLICENSE.txt"), ("dharmic-LICENSE.txt", "MANAS-ODBL.txt")]:
        (target / output_name).write_bytes((args.source_dir / source_name).read_bytes().replace(b"\r\n", b"\n"))
    manifest = {"schema": 1, "importedOn": "2026-11-04", "inputs": inputs, "outputs": outputs,
        "sources": {"gita": {"repository": "https://github.com/gita/gita", "commit": GITA, "path": "data/verse.json"},
                    "manas": {"repository": "https://github.com/WirelessAlien/Ramcharitmanas", "commit": MANAS, "path": "main/data/verses/"},
                    "openings": {"repository": "https://github.com/bhavykhatri/DharmicData", "commit": SUPPLEMENT, "path": "Ramcharitmanas/"}},
        "transformations": ["Only original Gita text and chapter/verse identifiers; no transliteration, word meanings, translations or commentary imported.",
                            "Manas primary body retained in source order; literal escaped CRLF converted to line breaks; outer whitespace trimmed.",
                            "Original opening invocations added from the separately licensed supplement, only before its first chaupai.",
                            "Manas passage numbers are ordered reading units, not claims of canonical verse numbering. All original printed verse suffixes remain in text."],
        "editionNote": "Gita witness includes Arjuna's opening question in chapter 13 and therefore has 701 numbered entries. Manas is an attributed composite electronic witness, not a critical edition or a claim that all textual variants have been resolved."}
    (target / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Imported original-language texts: 18 Gita chapters and seven Manas kandas; no canonical catalogue or modern commentary changed.")


if __name__ == "__main__":
    main()
