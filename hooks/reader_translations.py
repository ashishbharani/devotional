"""Opt-in, source-pinned Reader translation assets; never alter sacred originals.

Only dedicated, reviewed passage packs are published. Their presence does not
certify completeness or establish that reviewer credentials were independently
verified; release still requires human evidence and owner approval.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from datetime import date
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "reader-translations"
CODES = ("en", "hi", "mr", "gu", "bn", "pa", "te", "kn", "ml", "ta")


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def collect(books: list[dict]) -> tuple[dict, dict]:
    """Validate *all* candidate approved assets before returning published data."""
    book_by_id = {book["id"]: book for book in books}
    original_hashes = json.loads(
        (ROOT / "data" / "reader-books" / "manifest.json").read_text(encoding="utf-8")
    )["outputs"]
    assets = {}
    index = {"schema": 1, "books": {}}
    for book in books:
        index["books"][book["id"]] = {"languages": {}}
    if not DATA.is_dir():
        return index, assets
    paths = sorted(DATA.glob("*/*.json"))
    for path in paths:
        book_id, code = path.parent.name, path.stem
        if book_id not in book_by_id or code not in CODES:
            raise ValueError("Unexpected reviewed Reader translation pack: " + path.as_posix())
        document = json.loads(path.read_text(encoding="utf-8"))
        original_file = book_id + ".json"
        if (document.get("schema") != 1 or document.get("book") != book_id
                or document.get("language") != code
                or document.get("sourceSha256") != original_hashes[original_file]
                or document.get("status") != "reviewed"):
            raise ValueError("Unreviewed/stale/invalid Reader pack: " + str(path))
        review = document.get("review")
        if not isinstance(review, dict) or not all(
            isinstance(review.get(key), str) and review[key].strip()
            for key in ("reviewer", "reviewedOn", "evidence", "rightsNote")
        ):
            raise ValueError("Missing independent-review evidence metadata: " + str(path))
        try:
            date.fromisoformat(review["reviewedOn"])
        except ValueError as exc:
            raise ValueError("Invalid reviewer date: " + str(path)) from exc
        url = urlsplit(review["evidence"])
        if url.scheme != "https" or not url.netloc:
            raise ValueError("Review evidence needs an HTTPS reference: " + str(path))
        passages = {item["id"]: item["text"]
                    for chapter in book_by_id[book_id]["chapters"]
                    for item in chapter["passages"]}
        units = document.get("translations")
        if not isinstance(units, dict) or not units:
            raise ValueError("An empty book pack is not a reviewed translation: " + str(path))
        for passage_id, unit in units.items():
            if passage_id not in passages or not isinstance(unit, dict):
                raise ValueError("Unknown passage ID/invalid unit: " + passage_id)
            text = unit.get("text")
            if (not isinstance(text, str) or not text.strip()
                    or text.strip() == passages[passage_id].strip()
                    or unit.get("sourceSha256") != digest(passages[passage_id])):
                raise ValueError("Missing, unchanged or wrong-source translation: " + passage_id)
        key = f"assets/reader-translations/{book_id}/{code}.json"
        # Parse/validate before emitting UTF-8, preserving all original source keys.
        assets[key] = json.dumps(document, ensure_ascii=False, separators=(",", ":"))
        index["books"][book_id]["languages"][code] = {
            "path": key,
            "reviewedPassages": len(units),
            "totalPassages": len(passages),
            "sourceSha256": original_hashes[original_file],
        }
    return index, assets


def review_inventory(books: list[dict]) -> dict:
    index, _ = collect(books)
    result = {"schema": 1, "status": "incomplete", "books": {}}
    for book in books:
        total = sum(len(c["passages"]) for c in book["chapters"])
        result["books"][book["id"]] = {
            "sourcePassages": total,
            "languages": {
                code: {
                    "reviewedPassages": index["books"][book["id"]]["languages"].get(code, {}).get("reviewedPassages", 0),
                    "missingPassages": total - index["books"][book["id"]]["languages"].get(code, {}).get("reviewedPassages", 0),
                } for code in CODES
            }
        }
    return result
