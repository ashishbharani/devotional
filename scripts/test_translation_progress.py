"""Verify coverage reporting never treats zero missing as linguistic certification."""
from render_translation_progress import CODES, render

language = lambda missing: {"allCandidatesMissing": missing}
report = {
    "pages": 3, "canonicalRows": 20, "uniqueCombinedCandidates": 10,
    "status": "incomplete", "languages": {code: language(10) for code in CODES}
}
result = render(report)
assert "0/10" in result and "0.00%" in result
assert "NOT linguistic certification" in result
assert "never authorizes deployment" in result
report["languages"]["hi"]["allCandidatesMissing"] = 0
result = render(report)
assert "10/10" in result and "100.00%" in result
assert "registration rate alone is insufficient" in result
report["languages"]["bn"]["allCandidatesMissing"] = -1
try:
    render(report)
except ValueError:
    pass
else:
    raise AssertionError("Negative unresolved count accepted")
print("PASS candidate-coverage summary never certifies translated content")
