"""One readable, fail-closed multilingual release-readiness report.

Reports machine-verifiable candidate coverage and declared review metadata,
NOT verified language proficiency, scholarly meaning, legal advice or deployment.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from audit_legal_translation_review import SOURCE, audit as legal_audit, CODES

def summarize(site, books, legal):
    if not isinstance(site.get("languages"), dict) or not isinstance(books.get("books"), dict):
        raise ValueError("Missing translation coverage inventories")
    legal_result=legal_audit(SOURCE.read_text(encoding="utf-8"),legal)
    blockers=[]
    report=["## HDC ten-language release readiness — NOT CERTIFIED","",
            "English is the original source; Hindi plus eight other Indian languages are targets.",
            "",
            "| Language | Hosted/catalogue units unresolved | Reader passages unresolved |",
            "|---|---:|---:|"]
    for code in CODES:
        hosted=site["languages"].get(code,{}).get("allCandidatesMissing")
        reader=sum(book["languages"].get(code,{}).get("missingPassages",0)
                   for book in books["books"].values())
        if not isinstance(hosted,int) or not isinstance(reader,int) or hosted<0 or reader<0:
            raise ValueError("Invalid source counts for "+code)
        if hosted: blockers.append(f"{code}: {hosted} hosted/catalogue source units unresolved")
        if reader: blockers.append(f"{code}: {reader} book passages unresolved")
        report.append(f"| {code} | {hosted:,} | {reader:,} |")
    report += ["",
        f"Legal Disclaimer clause/language review metadata: **{legal_result.get('approved',0)}/{legal_result.get('total',1125)}**.",
        f"Whole-Disclaimer (including four appendices) signoffs: **{legal_result.get('wholeDocumentApproved',0)}/9**.",
        ""]
    if legal_result["status"]!="ready-for-independent-evidence-verification":
        blockers.append("125-clause and full-document linguistic/legal reviews remain incomplete")
    report += [
        "**Functional verification:** automated test results must be reviewed on the exact candidate commit, "
        "covering the full route set, forms, dynamic states, mobile layouts and PWA/offline behavior. "
        "The static dictionary inventory cannot verify all interactive states.",
        "",
        "**Independent verification:** reviewer identity, proficiency, source fidelity, "
        "religious meaning, rights and legal advice cannot be certified by this report or "
        "an AI-generated translation. Validate documented evidence separately.",
        "",
        "**Release status:** "+("MACHINE AND REVIEW-METADATA GATES READY FOR HUMAN VERIFICATION"
        if not blockers else "INCOMPLETE — KEEP DRAFT / DO NOT DEPLOY"),
        "",
    ]
    if blockers:
        report+=["### Unresolved gates",*["- "+item for item in blockers],""]
    report+=["Even zero missing units and complete reviewer metadata are not themselves independent certification.",
             ""]
    return "\n".join(report),len(blockers)==0

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site",type=Path,default=Path("work/translation-coverage.json"))
    parser.add_argument("--books",type=Path,default=Path("work/reader-translation-coverage.json"))
    parser.add_argument("--legal",type=Path,default=Path("work/legal-125-review.json"))
    parser.add_argument("--output",type=Path,default=Path("work/multilingual-release-readiness.md"))
    parser.add_argument("--require-ready",action="store_true")
    args=parser.parse_args()
    report,ready=summarize(*[json.loads(path.read_text(encoding="utf-8"))
                              for path in (args.site,args.books,args.legal)])
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(report,encoding="utf-8")
    if path:=os.environ.get("GITHUB_STEP_SUMMARY"):
        with Path(path).open("a",encoding="utf-8") as stream:stream.write(report)
    print(report)
    return 1 if args.require_ready and not ready else 0

if __name__=="__main__":
    raise SystemExit(main())
