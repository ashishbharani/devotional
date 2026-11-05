"""Release-readiness summary never confuses dictionary registration with certification."""
from audit_legal_translation_review import SOURCE, CODES, draft
from multilingual_release_readiness import summarize

legal=draft(SOURCE.read_text(encoding="utf-8"))
site={"languages":{code:{"allCandidatesMissing":12} for code in CODES}}
books={"books":{"bhagavad-gita":{
    "languages":{code:{"missingPassages":701} for code in ("en", *CODES)}
}}}
message,ready=summarize(site,books,legal)
assert not ready and "INCOMPLETE" in message
assert "0/1125" in message and "0/9" in message
assert "701" in message and "12" in message
assert "| en | 0 | 701 |" in message
for value in site["languages"].values():value["allCandidatesMissing"]=0
for value in books["books"]["bhagavad-gita"]["languages"].values():value["missingPassages"]=0
message,ready=summarize(site,books,legal)
assert not ready and "Independent verification" in message
assert "Even zero missing units" in message
books["books"]["bhagavad-gita"]["languages"]["en"]["missingPassages"]=701
message,ready=summarize(site,books,legal)
assert not ready and "en: 701 book passages unresolved" in message
english=books["books"]["bhagavad-gita"]["languages"].pop("en")
try:summarize(site,books,legal)
except ValueError:pass
else:raise AssertionError("Omitted English Reader coverage must fail closed")
books["books"]["bhagavad-gita"]["languages"]["en"]=english
site["languages"]["hi"]["allCandidatesMissing"]=-1
try:summarize(site,books,legal)
except ValueError:pass
else:raise AssertionError("Negative counts cannot certify release")
print("PASS incomplete site, book, legal and independently reviewed statuses never show certification")
