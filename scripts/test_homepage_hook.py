"""Regression for MkDocs console-entry hook loading, with no ambient repo path.

Run with `python -I scripts/test_homepage_hook.py`. MkDocs restores sys.path
after loading hooks; imports needed later must already have been resolved.
"""
import importlib.util
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
original_path = sys.path[:]
spec = importlib.util.spec_from_file_location("homepage_hook_regression", root / "hooks" / "generate.py")
hook = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(hook)
finally:
    sys.path[:] = original_path
assert str(root) not in sys.path, "Run in isolated mode (-I), without an ambient repository path"
html = hook.page_home(hook.load())
assert 'id="udhc-title"' in html
assert 'data-panchang-view="summary"' in html
assert "ULTIMATE HINDU DEVOTIONAL COLLECTION" in html
print("PASS homepage hook renders after MkDocs restores its import path")
