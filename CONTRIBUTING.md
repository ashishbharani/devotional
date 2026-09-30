# Contributing — a short guide

Thank you for helping! You don't need to be a programmer. There are three ways to help, from easiest to most involved.
First-time? Do the one-time steps in **[SETUP.md](SETUP.md)**.

---

## 1. Report a problem (no editing at all)

Go to the repository on GitHub → **Issues** → **New issue** and pick a form:

- **Fix a work** — wrong title, language, tier, singer, broken YouTube link…
- **Add a missing work** — a prayer, stotra, bhajan… that should be in the collection
- **Website problem** — something looks broken or is hard to use

Fill in the boxes and press **Submit**. That's it — a maintainer turns it into a fix.

---

## 2. Fix or add works yourself (two small spreadsheet-like files)

The 43,085 works come from the PDF and are **not** edited directly. Instead, fixes and additions go into two small
files that are applied every time the website is built:

| File | Use it to… | One line looks like |
| --- | --- | --- |
| `data/corrections.csv` | change or delete an existing work | `1,GANESHA,Sukhkarta Dukhharta,language,Marathi` |
| `data/additions.csv` | add a missing work | `1,GANESHA,Aarti,Ganpati Bappa Morya Aarti,Marathi,T2,,Morning worship,,,,` |

**Columns in `corrections.csv`**

| column | what to write |
| --- | --- |
| category | the category number, 1–42 (from the Integrated Master Index) |
| group | the deity / tradition name as shown on the site, e.g. `GANESHA` — or leave empty to fix it everywhere in that category |
| title | the work's title **exactly** as it appears on the site now |
| field | what to change: `title`, `language`, `form`, `tier`, `singer`, `purposes`, `best time`, `jyotisha`, `affliction`, `youtube` — or `delete` |
| new value | the corrected text (leave empty for `delete`) |

**Columns in `additions.csv`**: `category, group, form, title` are required; `language, tier, singer, purposes, best time,
jyotisha, affliction, youtube` are optional. Tier defaults to `T2`; the YouTube link defaults to a search for the title.

**Rules of thumb**

- One change per line. Put text that contains a comma inside double quotes: `"Om Jai Jagdish Hare, Aarti"`.
- Tiers are only `T1`, `T2`, `T3` or `T4`.
- Lines starting with `#` are notes and are ignored.
- If a title or category can't be found, the automatic check tells you the exact line number — nothing breaks on the live site.

### Easiest way: ask ChatGPT / Codex to do it

Codex can open the repository, make the edit and send it for review. Copy one of these prompts and fill in the details:

> In the repo ashishbharani/devotional, follow AGENTS.md. Add a line to data/corrections.csv: in category 1, group
> GANESHA, change the language of "Sukhkarta Dukhharta" to Marathi. Run the build check and open a pull request.

> In the repo ashishbharani/devotional, follow AGENTS.md. Add these works to data/additions.csv: [paste your list —
> category, deity, form, title, language]. Run the build check and open a pull request.

> In the repo ashishbharani/devotional, follow AGENTS.md. The YouTube link for "Hanuman Chalisa" in category 1
> (group HANUMAN) should be https://www.youtube.com/watch?v=… — add it to data/corrections.csv and open a pull request.

### Or edit on the GitHub website yourself

1. Open `data/corrections.csv` (or `additions.csv`) on GitHub and click the ✏️ **pencil** icon.
2. Add your line(s) at the bottom.
3. Click **Commit changes…** → choose **Create a new branch … and start a pull request** → **Propose changes** → **Create pull request**.

---

## 3. Improve the website itself (layout, translations, features)

Use Codex / ChatGPT with a clear request, for example:

> In the repo ashishbharani/devotional, follow AGENTS.md. On phones, make the category names on the Integrated Master
> Index slightly larger. Keep it accessible. Run the checks and open a pull request with before/after screenshots.

---

## What happens after you send a change

1. A **pull request** is opened. GitHub automatically builds the whole site to check it (about 2 minutes).
   - ✅ green tick — everything is fine.
   - ❌ red cross — click **Details**; the message says what's wrong (for example
     `corrections.csv line 4: no work titled 'Ganesh Aarti' found in category 1`). Fix that line or ask Codex to.
2. A maintainer reviews it and clicks **Merge**.
3. The live website updates automatically a couple of minutes later:
   **https://ashishbharani.github.io/devotional/**

Please be kind and respectful in issues and reviews — this is a devotional project shared with families.
