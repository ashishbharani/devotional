# Suggestion and issue reporting

## Receiving service

The shared vanilla-JavaScript implementation lives in `docs/javascripts/feedback.js`.
The clearly marked `FEEDBACK_ENDPOINT` constant near the top (line 5) is the only
receiving-service setting. It is configured to the **public**, non-secret URL
`https://formspree.io/f/mjyknzvy`. Never put account credentials or API tokens here.
For a fresh installation the unconfigured value is `"YOUR_FORM_ENDPOINT_HERE"`;
that value safely disables sending and explains that nothing has been sent.

The owner requested account setup. The form named **Hindu Devotional Collection —
Suggestions and Reports** was created in the owner's signed-in Formspree account,
using its already verified recipient. No account password or recipient address
is embedded in the public site. Form Enabled and Submission Archive are on,
Formshield spam filtering is on, and CAPTCHA is disabled by default. No paid
upgrade or change to account security was made. The account currently allows
50 submissions/month; monitor the quota in Formspree. A public form URL is
intentionally public and can be abused: the browser honeypot and rate protection
are not a substitute for provider-side spam filtering and quota monitoring.

Sign in at Formspree → this form → Submissions to review reports. Workflow handles
email delivery. A stored submission verifies provider receipt, **not** delivery
to the recipient's email inbox; check inbox/spam and notification settings too.
Submission limits and account retention policies are controlled by the provider.

## Submission contract

The form sends `POST` multipart `FormData` with `Accept: application/json`.
Do not set a multipart Content-Type manually: the browser supplies the boundary.
The receiving service must support HTTPS, browser cross-origin POST, and JSON
acknowledgements with a successful HTTP status (no `error`/`errors` or `ok:false`).
HTML challenge/login responses and redirects are rejected, not treated as receipt.
Cookies and the browser Referer are not sent. A 20-second timeout prevents a
permanently disabled sending button; a failed request retains the message.
A timeout/network failure can happen **after** acceptance, so the error tells
visitors to avoid retrying if they already have confirmation.

Fields: `report_type`, required trimmed `message` (maximum 3,000 characters),
optional `name`, optional `email`, `_gotcha` honeypot, `_subject`, `submitted_at`
(UTC ISO time), and available context: `page_url`, `page_title`, `reported_url`,
`anchor_text`, `heading`, `work_title`, `category`, `section`, `form`, `cwid`,
`book_title`. Blank emails and unavailable context are omitted. Contact fields
are cleared after success; they are not stored in browser storage. Only the last
successful submission timestamp is stored in sessionStorage for a 60-second
client cooldown. It falls back to in-memory protection if storage is unavailable.

For privacy, the automatically collected page URL excludes its query string
(which may contain authentication tokens or precise location settings).
Explicitly reported external links retain their exact URL, including query
parameters necessary to identify YouTube searches/book resources. The form
shows that URL to the visitor. HTTP/HTTPS URLs with embedded credentials are
rejected. No phone/address, browser user-agent, fingerprint, analytics, or tracker
is collected. Visitors must not submit sensitive information in their message.

## Integration and preservation

`mkdocs.yml` appends the new assets to existing lists. `hooks/generate.py` adds
one item to the existing Tools menu and includes the small feedback stylesheet
in the existing PWA shell/version signature. No catalogue/database edits or
per-work generated report markup are necessary. `docs/tools/feedback/index.md`
uses normal MkDocs navigation and opens the same modal automatically.

The shared reporter scans only the main content, adds one adjacent button per
eligible external textual HTTP/HTTPS anchor, and delegates clicks globally.
Navigation, same-origin links, anchors, mail/telephone/script links, actions,
image-only anchors, forms, and explicit `[data-no-feedback]` containers are
excluded. Book resource links styled as buttons are intentionally supported;
other action-style `.abp-btn` links are excluded to avoid disrupting widgets.
The original anchor is not rewritten or intercepted. Book resource anchors alone
are grouped with their report control in a small runtime span, preserving one
resource per grid cell rather than shifting every link when an icon is inserted.
On narrow phones these pairs use two columns to keep touch controls readable.
The observer handles dynamically generated Find/A–Z/Favourites results and
disconnects from an old content root after Material instant navigation.
Repeated initialization/rescanning does not duplicate icons or listeners.

Context is read only when opening the form, from the nearest existing row/card,
work-ID attributes, table/category metadata, book title and preceding headings.
No ID is required. No full devotional database is loaded by this feature.

Native `<dialog>.showModal()` provides background inertness and focus trapping.
Escape, close and backdrop clicks close it; focus returns to the opener. CSS
locks background scrolling. On unsupported old browsers a clear upgrade notice
is used rather than an inaccessible pseudo-modal. All controls are labelled;
link report targets are 26px minimum and 44px on coarse-pointer touch devices.
Tokens follow the existing light/dark/high-contrast theme. No animations are added.
The floating button is placed above the iOS install-help banner when it appears;
bottom padding keeps footer controls reachable. Feedback controls are hidden in print.

## Regression repair found during integration

The merged `main` at `2ad049b` calls `solarForDate()` but contains an obsolete,
unused `civilEvent()` instead of its definition. The Panchang suite failed with
`ReferenceError: solarForDate is not defined` before any feedback changes to it.
The original `solarForDate` cache wrapper was restored unchanged from
`origin/feature/panchang-comprehensive-upgrade`. It uses the already imported
`solarEvents` and `localDayBounds`; no astronomy algorithm or data was replaced.
The browser regression also found a merged call to undefined `noCivilEvent()`
on dates without a lunar event. The home renderer now uses its already imported
`formatMoonEvent()` for Moonrise/Moonset, matching the existing daily renderer.
These two repairs preserve the established engine and no-event conventions.
The merged location controls also contained two timezone inputs with the same
ID. The obsolete duplicate was removed, keeping the labelled, described control
and its current selected-timezone behaviour. This fixes the existing accessibility
ambiguity and the unmodified browser regression's strict-selector failure.

## Development and verification

```sh
uv sync
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
node scripts/test_panchang.mjs
node scripts/test_ephemeris.mjs
uv run mkdocs build --strict
uv run python scripts/check_site.py
uv run python scripts/check_i18n.py
node scripts/test_feedback_browser.mjs
pnpm test:browser
uv run mkdocs serve --dev-addr 127.0.0.1:8000
```

Do not run a build that cleans `site/` at the same time as browser tests reading
it. The feedback browser suite uses a local server with the `/devotional/` prefix
and intercepts every feedback endpoint request with a mock: it **never** sends
real reports. `FEEDBACK_SCREENSHOTS=work/feedback-browser` enables screenshots.
The PR workflow runs the suite and uploads its screenshots. For a live test use
the local form yourself with a clearly labelled test message, then confirm it
appears in Formspree Submissions. Do not announce receipt from a mock test.

The maintainer merges the PR; the existing deployment workflow publishes Pages.
After deployment, verify the production homepage, a generated work page, books,
Tools auto-open, multiple instant transitions, mobile layout, the two assets
under `/devotional/`, console/network and one provider-confirmed real report.
Local verification does not prove the not-yet-deployed feature is live.
