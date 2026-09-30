# One-time setup (about 10 minutes, no programming)

This gets you ready to suggest fixes to the **Ultimate Hindu Devotional Collection** website using ChatGPT / Codex
or the GitHub website. Afterwards, see **[CONTRIBUTING.md](CONTRIBUTING.md)** for what to do.

---

## Step 1 — Create a GitHub account (skip if you have one)

1. Go to **https://github.com/signup** and create a free account.
2. Send your **GitHub username** to the maintainer who invited you to help.

## Step 2 — Accept the invitation

The maintainer adds you under *Settings → Collaborators* of the repository. You'll get an email from GitHub —
click **Accept invitation**. You now have access to **https://github.com/ashishbharani/devotional**.

> Without an invitation you can still help: open the repository and click **Fork** (top right). Your changes then
> come in as a "pull request" from your copy — everything below works the same.

## Step 3 — Connect ChatGPT / Codex to GitHub

1. Open **https://chatgpt.com/codex** (you need a ChatGPT plan that includes Codex).
2. Choose **Connect to GitHub** and sign in with your GitHub account.
3. When GitHub asks which repositories Codex may use, allow **ashishbharani/devotional** (or your fork).
4. Codex asks you to create an **environment** for the repository. Use:
   - **Setup script**:
     ```bash
     pip install uv && uv sync
     ```
   - Leave everything else as it is and save.

That's all. Codex automatically reads the file **`AGENTS.md`** in the repository, which tells it how this project works,
which files to edit and how to check its work — you don't need to explain any of that yourself.

*(Menu names inside ChatGPT change from time to time; if something looks different, look for "Environments" or
"Connect GitHub" in Codex settings.)*

## Step 4 — Your first contribution (practice run)

In Codex, pick the **ashishbharani/devotional** environment and type:

> Follow AGENTS.md. In data/corrections.csv, add a correction for category 1, group GANESHA: set the "best time" of
> "Ganesha Ashtakam" to Morning. Run the build check and open a pull request.

Codex will make the change, run the check and show you a **Create PR** / **Open pull request** button. Click it.
On GitHub you'll see the pull request with an automatic check. When it shows a ✅, tell the maintainer — they merge it and the
website updates by itself.

---

## Optional — preview the website on your own computer

Only needed if you want to see changes before sending them. Codex can also show you screenshots instead.

**Mac**
1. Install **GitHub Desktop** from https://desktop.github.com, sign in, then *File → Clone repository* →
   `ashishbharani/devotional`.
2. Open the **Terminal** app once and paste this line, then press Enter (installs the tool the site uses):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
3. In Finder, open the cloned folder and double-click **`preview.command`**.
   The first time, macOS may say it's from an unidentified developer: right-click → **Open** → **Open**.
4. Your browser opens the site at http://127.0.0.1:8000 — it refreshes when files change. Close the Terminal window to stop.

**Windows**
1. Install **GitHub Desktop** and clone the repository as above.
2. Open **PowerShell** once and paste:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```
3. Double-click **`preview.bat`** in the cloned folder.

The first preview takes a minute or two (it builds all 43,085 works); after that it's quick.

---

## Need help?

Open an issue on GitHub (**Issues → New issue**) or ask the maintainer. You can't break the live website: every change is
checked automatically and reviewed before it goes live.
