"""Create and validate 125-clause legal translation review packets.

A file with filled-in review metadata is not, by itself, proof of the
reviewer's qualifications or independence. Real signoffs must be verified
outside this script against primary GitHub/contractual records.
"""
from __future__ import annotations

import argparse
import hashlib
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs/disclaimer.md"
CODES = ("hi", "mr", "gu", "bn", "pa", "te", "kn", "ml", "ta")
CLAUSE = re.compile(
    r'<h3 id="clause-([0-9]+)">([^<]+)</h3>(.*?)'
    r'(?=<h3 id="clause-|<h2 id="part-|<section id="appendix-|</article>)',
    re.S,
)


class Visible(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fragments = []
    def handle_data(self, data):
        self.fragments.append(data)


def plain(value):
    text = Visible()
    text.feed(value)
    return " ".join(unescape("".join(text.fragments)).split())


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def extract(source):
    clauses = []
    for match in CLAUSE.finditer(source):
        number = int(match.group(1))
        title = plain(match.group(2))
        body = match.group(3)
        segments = [title]
        segments.extend(plain(item) for item in re.findall(r"<p(?:\s[^>]*)?>(.*?)</p>",body,re.S))
        segments = [s for s in segments if s]
        if len(segments) < 2:
            raise ValueError("Legal clause has no body: " + str(number))
        clauses.append({
            "number": number, "sourceSha256": digest(match.group(0)),
            "sourceSegments": segments,
        })
    ids = [item["number"] for item in clauses]
    if ids != list(range(1,126)):
        raise ValueError("Expected all 125 distinct ordered Disclaimer clauses")
    return clauses


def draft(source):
    result = {
        "schema":1, "sourcePath":"docs/disclaimer.md",
        "sourceSha256":digest(source), "status":"unreviewed",
        "notice":"Translation quality and legal reviewer independence must be verified externally.",
        "clauses":extract(source),
    }
    for clause in result["clauses"]:
        clause["reviews"] = {
            code:{
                "status":"unreviewed", "translations":[],
                "linguisticReviewer":"", "legalReviewer":"",
                "reviewDate":"", "evidence":"", "notes":""
            } for code in CODES
        }
    return result


def audit(source, packet):
    originals = extract(source)
    issues=[]
    if (not isinstance(packet,dict) or packet.get("schema") != 1
        or packet.get("sourceSha256") != digest(source)
        or packet.get("sourcePath") != "docs/disclaimer.md"):
        return {"status":"invalid","approved":0,"total":125*len(CODES),
                "issues":["Legal source SHA mismatch; regenerate and re-review"]}
    entries=packet.get("clauses")
    if not isinstance(entries,list) or len(entries)!=125:
        return {"status":"invalid","approved":0,"total":125*len(CODES),
                "issues":["Missing or extra legal clauses"]}
    approved=0
    for original,record in zip(originals,entries):
        if not isinstance(record,dict) or any(record.get(k)!=original[k] for k in ("number","sourceSha256","sourceSegments")):
            return {"status":"invalid","approved":0,"total":125*len(CODES),
                    "issues":["Changed legal source/segments in review packet"]}
        reviews=record.get("reviews")
        if not isinstance(reviews,dict) or set(reviews)!=set(CODES):
            return {"status":"invalid","approved":0,"total":125*len(CODES),
                    "issues":["Missing or unknown target languages"]}
        for code,entry in reviews.items():
            if not isinstance(entry,dict):
                issues.append(f"Clause {record['number']} {code}: malformed review")
                continue
            if entry.get("status")!="approved":
                continue
            translations=entry.get("translations")
            if (not isinstance(translations,list)
                or len(translations)!=len(original["sourceSegments"])
                or any(not isinstance(value,str) or not value.strip() for value in translations)):
                issues.append(f"Clause {record['number']} {code}: missing translated segments")
                continue
            if any(a == b for a,b in zip(translations,original["sourceSegments"])):
                issues.append(f"Clause {record['number']} {code}: unchanged English source")
                continue
            if not all(isinstance(entry.get(k),str) and entry[k].strip()
                       for k in ("linguisticReviewer","legalReviewer","reviewDate","evidence")):
                issues.append(f"Clause {record['number']} {code}: missing reviewer metadata")
                continue
            try:
                from datetime import date
                date.fromisoformat(entry["reviewDate"])
            except ValueError:
                issues.append(f"Clause {record['number']} {code}: invalid review date")
                continue
            url=urlsplit(entry["evidence"])
            if url.scheme!="https" or not url.netloc:
                issues.append(f"Clause {record['number']} {code}: untrusted evidence URL")
                continue
            approved+=1
    return {
        "status":"ready-for-independent-evidence-verification" if approved==125*len(CODES) and not issues else "incomplete",
        "approved":approved,"total":125*len(CODES),"unapproved":125*len(CODES)-approved,
        "issues":issues[:40],
        "notice":"Metadata and source integrity validated only; human independence and legal accuracy not certified by this script."
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output",type=Path,default=Path("work/legal-125-review.json"))
    parser.add_argument("--review",type=Path)
    parser.add_argument("--require-approved",action="store_true")
    args=parser.parse_args()
    original=SOURCE.read_text(encoding="utf-8")
    if args.review:
        document=json.loads(args.review.read_text(encoding="utf-8"))
    else:
        document=draft(original)
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(document,ensure_ascii=False,indent=2),encoding="utf-8")
    result=audit(original,document)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 1 if args.require_approved and result["status"]!="ready-for-independent-evidence-verification" else 0


if __name__=="__main__":
    raise SystemExit(main())
