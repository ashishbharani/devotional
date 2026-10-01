"""Audit the browser translation catalogue without third-party dependencies."""

from __future__ import annotations

import json
from pathlib import Path


LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "gu": "Gujarati",
    "bn": "Bengali",
    "pa": "Punjabi",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "ta": "Tamil",
}


def audit_catalogue(path: Path) -> tuple[list[str], list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    sections = data.get("sections", [])
    keys = [key for section in sections for key in section.get("keys", [])]
    errors: list[str] = []
    if len(keys) != len(set(keys)):
        duplicates = sorted({key for key in keys if keys.count(key) > 1})
        errors.append(f"duplicate translation keys: {', '.join(duplicates)}")

    report = []
    for code, label in LANGUAGES.items():
        present = 0
        missing = []
        for section in sections:
            section_keys = section.get("keys", [])
            values = section.get("values", {}).get(code, [])
            if len(values) != len(section_keys):
                errors.append(
                    f"{label}: section '{section.get('name', 'unnamed')}' has {len(values)} values for {len(section_keys)} keys"
                )
            for index, key in enumerate(section_keys):
                value = values[index].strip() if index < len(values) and isinstance(values[index], str) else ""
                if value:
                    present += 1
                else:
                    missing.append(key)
        percent = round((present / len(keys)) * 100) if keys else 100
        report.append(f"Translation completeness — {label}: {percent}% interface keys ({present}/{len(keys)})")
        if missing:
            errors.append(f"{label}: missing interface keys: {', '.join(missing)}")

    category_names = data.get("categoryNames", {})
    for code, label in LANGUAGES.items():
        count = len([value for value in category_names.get(code, []) if isinstance(value, str) and value.strip()])
        report.append(f"Category-name translations — {label}: {count}/42 (other names use safe script transliteration)")
        if count not in (0, 42):
            errors.append(f"{label}: category-name translation list must contain either 0 or 42 entries (found {count})")

    return report, errors


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    report, errors = audit_catalogue(root / "docs" / "assets" / "i18n.json")
    print("\n".join(report))
    if errors:
        print("\nTranslation audit errors:")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
