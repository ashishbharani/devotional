# AGENTS.md — instructions for AI coding agents (Codex, ChatGPT, Claude, Copilot…)

You are helping maintain the **Ultimate Hindu Devotional Collection** website (MkDocs + Material, deployed to
GitHub Pages at https://ashishbharani.github.io/devotional/). The person asking you is usually **not a software
engineer**: explain what you changed in plain language, keep changes small, and always open a pull request.

## Setup and checks

```bash
pip install uv          # if uv is missing
uv sync                 # installs mkdocs + mkdocs-material from uv.lock
uv run mkdocs build --strict      # MUST pass before you open a PR (≈1–2 min, builds 43k works)
uv run mkdocs serve               # local preview at http://127.0.0.1:8000
```

`--strict` turns every warning into a failure. Warnings from `corrections.csv` / `additions.csv` name the exact
line — fix the CSV row, don't silence the warning.

## Where things live

| Path | What it is | May you edit it? |
| --- | --- | --- |
| `data/collection.json` | 43,085 works extracted from the source PDF (15 MB, one line) | **No.** Regenerated only by `scripts/extract_pdf.py`. |
| `data/corrections.csv` | community fixes to existing works | **Yes — preferred place for fixes** |
| `data/additions.csv` | community-added works | **Yes — preferred place for new works** |
| `hooks/generate.py` | builds every page from the JSON at build time (no hand-written Markdown for the catalogue) | Yes, carefully |
| `hooks/sw.template.js` | one-time legacy service-worker/cache cleanup | Only for migration work |
| `theme/` | Material `custom_dir` overrides (`main.html`, partials) | Yes |
| `docs/stylesheets/abp.css` | the whole visual theme, colour tokens, mobile + accessibility layers | Yes |
| `docs/javascripts/abp.js`, `abp-directory.js`, `abp-japa.js`, `abp-a11y.js` | Find, A–Z, counter and accessibility panel | Yes |
| `docs/javascripts/abp-i18n.js`, `docs/assets/i18n.json` | interface translation runtime and canonical strings | Yes |
| `docs/javascripts/abp-cleanup.js` | unregisters the retired site worker and removes only `abp-*` caches | Yes, carefully |
| `docs/assets/images/` | icons, cover and supporting images | Yes |
| `site/` | build output | Never commit |

A hand-written file in `docs/` with the same path as a generated page (e.g. `docs/foreword.md`) overrides it.

## CSV formats

`data/corrections.csv` — header `category,group,title,field,new value`
- `category`: 1–42. `group`: deity/tradition name as shown on the site (case-insensitive) or empty = whole category.
- `title`: current title, exact (case/space-insensitive).
- `field`: `title | language | form | tier | singer | purposes | best time | jyotisha | affliction | youtube | delete`.
- Tier must be `T1`–`T4`. Links must start with `https://`. Quote values containing commas.

`data/additions.csv` — header `category,group,form,title,language,tier,singer,purposes,best time,jyotisha,affliction,youtube`
- `category, group, form, title` required. Tier defaults to `T2`; `youtube` defaults to a YouTube search for the title.
- Before adding, search `data/collection.json` (e.g. `grep -o '"title":"[^"]*Hanuman Chalisa[^"]*"'`) to avoid duplicates
  in the same group/form.

## Non-negotiable rules

1. **Accessibility (WCAG 2.2 AA) must not regress.** Keep: one `h1` per page and no skipped heading levels;
   text contrast ≥ 4.5:1 in light **and** dark (`[data-md-color-scheme="abp-dark"]`) and high-contrast (`html.abp-hc`);
   visible focus; targets ≥ 24 px (44 px on touch); every control has an accessible name; no information by colour
   alone; respect `prefers-reduced-motion` / `html.abp-still`. Use the `.abp-sr` class for screen-reader-only text.
2. **Mobile first.** Must work on iPhone SE (320 px) to desktop with no horizontal scrolling; tables become cards
   below 960 px. Don't use `contain-intrinsic-size` (use `contain-intrinsic-height`).
3. **Performance.** Pages are generated for ~2,300 sections; keep per-row markup lean (ARIA roles for table cells are
   added at runtime by `abp-a11y.js`). Groups over 250 works are split into `part-N/` pages.
4. **Colours** come from CSS tokens (`--abp-*`) and per-category `--abp-cat` / `--abp-cat-ink`; text in a category
   colour must use `--abp-cat-ink` (auto-darkened by `cat_ink()` in the hook).
5. **Content is devotional and belongs to its compiler** (Advocate Ashish Bharani). Don't invent works, singers,
   purposes or astrological claims; only add what the contributor provided or what a reliable source states, and keep
   the disclaimer intact.
6. Don't commit `site/`, `.venv/` or the source PDF. Don't change `data/collection.json` by hand.
7. Keep the existing Python/JS style; no new dependencies without a clear reason (dependencies are managed with uv).

## Pull requests

- Branch name like `fix/ganesha-language` or `add/marathi-aartis`.
- Title in plain English ("Fix language of Sukhkarta Dukhharta"). In the description: what changed, why, and the
  result of `uv run mkdocs build --strict`. For visual changes, include before/after screenshots at phone and desktop width.
- The PR check (`.github/workflows/check.yml`) repeats the strict build; the maintainer merges; `deploy.yml` publishes.
