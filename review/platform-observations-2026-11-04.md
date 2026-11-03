# Owner-assisted platform observations — 4 November 2026

Tested source: `fb74884a18358804fcf584662a81ad34f038aadd`, with `HDC_PRACTICE_PREVIEW=1`.
These observations concern that candidate, not any subsequent source revision.

## Evidence and staging boundary

The owner reported the following actual manual outcomes in the maintenance chat. The agent did not hear Narrator, capture Speech Recap text, or remotely instrument the phone. These reports supplement automated checks; they are not a formal accessibility certification.

Windows used the local preview at `http://127.0.0.1:4370/devotional/`. Android used the separate owner-private HTTPS [device staging site](https://hdc-device-staging-fb74884.ashishbharani.chatgpt.site/devotional/). Its deployment `appgdep_6aea26b628788191bcf21847c7c2dd2d` succeeded. The 2,705 copied build files were checked against the source artifact hashes. Private staging has separate origin storage from the live website.

This is not a GitHub Pages production deployment. PR 51 remains draft, preview remains default-OFF, and no final staging or deployment approval is recorded.

## Windows results

Installed Chrome: `156.0.8078.80`; observed Windows version: `10.0.26120.0`. Installed Narrator binary: `10.0.26100.6713` (runtime version not independently confirmed). The owner confirmed Narrator was running. Reports were received during the 3–4 November session.

| Task | Owner-reported outcome |
| --- | --- |
| Reader heading navigation | PASS: both Reader and Bhagavad Gita 2.47 headings announced correctly |
| Bookmark twice | PASS: button switches; both pressed/not-pressed states announced |
| IAST disclosure | PASS: expanded/collapsed states announced; open text reachable |
| Aa dialog, then Escape | PASS: dialog announced; closes; focus returns to Aa |
| 200% zoom in both themes | PASS: all six primary destinations and menus readable and keyboard-reachable, without clipping or horizontal page scrolling |
| Ganesha header search → result → Back | PASS: labels/results usable with Narrator; Back returns correctly |

## Android results

Owner-reported device: **Samsung A57, Android 17, Chrome 156.0.8078.75**. No serial number, account credentials or precise device location was collected.

| Task | Owner-reported outcome |
| --- | --- |
| Private HTTPS homepage | PASS: homepage opens correctly |
| Explicit Install App interaction | PASS: native installation prompt appears |
| Install and launch from app icon | PASS: standalone opens without Chrome's address bar; installation controls hidden |
| Visit Reader online, bookmark, disconnect, reopen Reader | PASS: Reader text and bookmark work offline |
| Portrait/landscape, six main destinations, Library/work links, Ganesha search → result → Back | PASS: all work without clipped controls, overlap or horizontal page scrolling |
| Meerut across Daily Panchang, Monthly Panchang and Ephemeris, then reload | PASS: all match and persist; Asia/Kolkata, latitude 28.9845, longitude 77.7064, elevation 224 m |

The accepted installation does not establish the separate dismissed-prompt outcome. Offline reopening does not establish a subsequent service-worker upgrade, general offline availability of every page, or indefinite persistence.

## Still open

- Actual Android worker-update observation and dismissed-prompt outcome. Existing automated worker-upgrade tests remain a separate evidence class.
- Actual iOS/Safari installation, standalone and safe-area observations. On 4 November the owner confirmed that no iPhone/iPad is available; this remains unverified, not waived.
- L1 authored/native-reviewed translations; reviewers remain unavailable.
- Exact final candidate freeze, remaining review and explicit staging/release approval. No missing requirement is waived by this record.

Full configured CI passed on the tested source: [run 41686397225](https://github.com/ashishbharani/devotional/actions/runs/41686397225). Later evidence-only edits require their own build/check results; this run does not validate a later commit.

The documentation update recording these observations passed `uv run mkdocs build --strict` in 120.53 seconds on 4 November. Both generated maintenance pages were checked for the latest six Android task groups. No runtime source or production configuration changed.

`uv run python scripts/check_site.py` also passed: 16 routes, 43,085 canonical work IDs, Panchang, favourites and scoped PWA shell.
