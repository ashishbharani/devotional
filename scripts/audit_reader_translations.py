"""Report optional parallel sacred-book translation coverage; never mislabel it as review."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from hooks.reader_books import load_books
from hooks.reader_translations import review_inventory


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('work/reader-translation-coverage.json'))
    parser.add_argument('--require-complete', action='store_true')
    args = parser.parse_args()
    report = review_inventory(load_books())
    missing = sum(item['missingPassages']
                  for book in report['books'].values()
                  for item in book['languages'].values())
    total = sum(book['sourcePassages'] * len(book['languages']) for book in report['books'].values())
    report['missingBookLanguagePairs'] = missing
    report['totalBookLanguagePairs'] = total
    report['status'] = 'requires-independent-certification' if missing == 0 else 'incomplete'
    report['notice'] = (
        'Counts only source-pinned, reviewer-metadata-bearing passage packs. '
        'It cannot confirm reviewer independence, meaning accuracy, rights '
        'compliance, or holistic scriptural certification.'
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({
        'status':report['status'], 'book_language_passages_total':total,
        'missing':missing,
        'reviewed_by_book': {name:{code:v['reviewedPassages']
            for code,v in book['languages'].items()} for name,book in report['books'].items()}
    }, ensure_ascii=False, indent=2))
    return 1 if args.require_complete and missing else 0


if __name__ == '__main__':
    raise SystemExit(main())
