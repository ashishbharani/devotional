"""Render auditable per-language dictionary candidate coverage, never certification."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


CODES = {
    "hi": "Hindi", "mr": "Marathi", "gu": "Gujarati", "bn": "Bengali",
    "pa": "Punjabi", "te": "Telugu", "kn": "Kannada",
    "ml": "Malayalam", "ta": "Tamil",
}


def render(report: dict) -> str:
    total = report.get("uniqueCombinedCandidates")
    if type(total) is not int or total < 0:
        raise ValueError("Run the updated hosted-text audit before rendering this summary")
    languages = report.get("languages", {})
    if not isinstance(languages, dict) or set(languages) != set(CODES):
        raise ValueError("Expected an audit record for every target language")
    lines = [
        "## HDC translation candidate coverage (NOT linguistic certification)",
        "",
        f"Compiled HTML pages: **{report['pages']:,}**; canonical works: **{report['canonicalRows']:,}**.",
        f"Distinct combined hosted/catalogue candidates: **{total:,}**.",
        "",
        "| Language | Registered distinct candidates | Unresolved candidates | Candidate registration |",
        "|:--|--:|--:|--:|",
    ]
    for code, name in CODES.items():
        data = languages[code]
        missing = data.get("allCandidatesMissing")
        if type(missing) is not int or not (0 <= missing <= total):
            raise ValueError("Invalid unresolved count for " + code)
        registered = total - missing
        rate = registered * 100 / total if total else 100
        lines.append(f"| {name} (`{code}`) | {registered:,}/{total:,} | {missing:,} | {rate:.2f}% |")
    lines += [
        "", "**Status:** " + str(report.get("status", "unknown")).upper(),
        "",
        "The percentages above measure dictionary registration against candidate",
        "source strings, **not** correct translation or certified whole-site coverage.",
        "Protected original scriptures and identities require source-review classification.",
        "Interactive/runtime-only variants, legal terminology and native-language reviews",
        "must be audited separately; a 100% registration rate alone is insufficient.",
        "",
        "This report never authorizes deployment or a completed-translation claim.",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", type=Path, default=Path("work/translation-coverage.json"))
    parser.add_argument("--output", type=Path, default=Path("work/translation-summary.md"))
    args = parser.parse_args()
    report = json.loads(args.audit.read_text(encoding="utf-8"))
    result = render(report)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(result, encoding="utf-8")
    if summary_path := os.environ.get("GITHUB_STEP_SUMMARY"):
        with Path(summary_path).open("a", encoding="utf-8") as stream:
            stream.write(result)
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
