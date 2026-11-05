"""Synthetic fixtures for the review importer; no production pack is modified."""
from __future__ import annotations

from copy import deepcopy

from audit_hosted_translations import CODES
from import_translation_review import stage_review

source = "Read {name} at https://example.org and email help@example.org"
id_ = "verified-source-id"
report = {"backlog": [{"id": id_, "source": source, "languages": ["hi", "mr"]}]}
packs = {code: {"translations": {}} for code in CODES}
record = {
    "id": id_, "source": source, "missingLanguages": ["hi", "mr"],
    "reviewStatus": "approved", "reviewer": "Language reviewer",
    "translations": {
        "hi": "पढ़ें {name} https://example.org और help@example.org",
        "mr": "",
    },
}
review = {"schema": 1, "records": [record]}
staged, counts = stage_review(review, report, packs)
assert counts["hi"] == 1 and counts["mr"] == 0
assert staged["hi"][source] == record["translations"]["hi"]
assert packs["hi"]["translations"] == {}, "dry run must not mutate the loaded pack"

for defect in ("stale-source", "duplicate", "missing-language", "unapproved",
               "unreviewed-with-content", "missing-reviewer", "lost-url", "lost-template", "collision"):
    broken_review = deepcopy(review)
    broken_packs = deepcopy(packs)
    row = broken_review["records"][0]
    if defect == "stale-source":
        row["source"] = "Changed source"
    elif defect == "duplicate":
        broken_review["records"].append(deepcopy(row))
    elif defect == "missing-language":
        row["translations"].pop("mr")
    elif defect == "unapproved":
        row["reviewStatus"] = "not-yet-approved"
    elif defect == "unreviewed-with-content":
        row["reviewStatus"] = "unreviewed"
    elif defect == "missing-reviewer":
        row["reviewer"] = ""
    elif defect == "lost-url":
        row["translations"]["hi"] = "पढ़ें {name}, help@example.org"
    elif defect == "lost-template":
        row["translations"]["hi"] = "पढ़ें https://example.org और help@example.org"
    elif defect == "collision":
        broken_packs["hi"]["translations"][source.upper()] = "old value"
    try:
        stage_review(broken_review, report, broken_packs)
    except ValueError:
        pass
    else:
        raise AssertionError("Importer accepted " + defect)

print("PASS reviewed translation import: sequential language passes, provenance, protected tokens and immutable packs")
