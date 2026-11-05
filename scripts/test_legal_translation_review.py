"""All 125 clauses must have source-pinned nine-language reviews; no fake approval."""
from copy import deepcopy

from audit_legal_translation_review import SOURCE, CODES, audit, draft, extract

source=SOURCE.read_text(encoding="utf-8")
clauses=extract(source)
assert [row["number"] for row in clauses]==list(range(1,126))
assert all(row["sourceSegments"] for row in clauses)
base=draft(source)
result=audit(source,base)
assert result["approved"]==0
assert result["unapproved"]==125*9
assert result["wholeDocumentApproved"]==0
assert result["wholeDocumentRequired"]==9
assert result["status"]=="incomplete"
sample=deepcopy(base)
one=sample["clauses"][0]["reviews"]["hi"]
one.update({
  "status":"approved",
  "translations":["काल्पनिक परीक्षण अनुवाद "+str(i) for i,_ in enumerate(sample["clauses"][0]["sourceSegments"])],
  "linguisticReviewer":"SYNTHETIC TEST ONLY",
  "legalReviewer":"SYNTHETIC TEST ONLY",
  "reviewDate":"2026-11-05",
  "evidence":"https://example.test/no-real-review"
})
# The synthetic record checks structural validation only: no reviewer is
# presented as a real independent reviewer or this file as an approval.
result=audit(source,sample)
assert result["approved"]==1 and result["unapproved"]==1124
assert result["wholeDocumentApproved"]==0
sample["wholeDocumentReviews"]["hi"].update({
  "status":"approved", "scope":"full-current-Disclaimer-including-all-four-appendices",
  "linguisticReviewer":"SYNTHETIC TEST ONLY",
  "legalReviewer":"SYNTHETIC TEST ONLY",
  "reviewDate":"2026-11-05",
  "evidence":"https://example.test/full-document-test"
})
assert audit(source,sample)["wholeDocumentApproved"]==1
assert result["status"]=="incomplete"
changed=deepcopy(sample)
changed["sourceSha256"]="0"*64
assert audit(source,changed)["status"]=="invalid"
changed=deepcopy(sample)
changed["clauses"][0]["sourceSegments"][0]="Altered source"
assert audit(source,changed)["status"]=="invalid"
changed=deepcopy(sample)
changed["clauses"][0]["reviews"].pop("ta")
assert audit(source,changed)["status"]=="invalid"
changed=deepcopy(sample)
changed["clauses"][0]["reviews"]["hi"]["evidence"]="javascript:alert(1)"
assert audit(source,changed)["approved"]==0
print("PASS 125 real legal clauses; 1125 target approvals required; SHA, segment and reviewer metadata fail closed")
