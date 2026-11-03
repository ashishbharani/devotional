---
title: HDC Completion Execution
---

# HDC completion execution

The owner resumed implementation on **3 November 2026** with “complete it.” The [completion audit](HDC_MASTER_COMPLETION_DASHBOARD.md) remains the historical evidence baseline; the [finite R1–R9 and L1 roadmap](HDC_REMAINING_INCREMENT_PLAN.md) defines the remaining scope. This ledger records subsequent delivery without rewriting historical test results or claiming approval.

**Release boundary:** PR 51 stays draft. `HDC_PRACTICE_PREVIEW` stays default-OFF. No merge, activation or deployment is performed by this continuation. The complete final candidate still requires staging approval.

## R1 — Saved-data compatibility

Current state: implementation and combined validation in progress.

- Reconciled production main `2153bec` in integration commit `5a836cb`. Preserve both the latest local translation loading/cache behavior and source/private `translate="no"` protections.
- Reuse the seven existing preview keys and formats; no migration, account-store duplication or key renaming.
- A small shared record guard preserves unfamiliar envelope and row fields, validates known fields, refuses malformed/future formats, and compares the saved snapshot before writes.
- Failed persistence keeps a visit-only draft. A subsequent external replacement/removal freezes that draft rather than overwriting the newer saved copy. A deliberate load of valid saved Journey changes replaces the draft; invalid saved changes do not.
- The guard survives same-document instant navigation. Its single storage listener also notices changes while the related page is detached. Full reload can lose unsaved visit-only changes, as disclosed; it never promises permanent storage when writes fail.
- Reader, Sanctuary, festival preferences, active Journey, routine library, Japa session history and section shortcuts share this behavior. Existing Japa counts, favourites, provider settings and astronomy remain separate and authoritative.
- The helper follows the existing preview activation and service-worker shell gates. It is omitted from the default production script list and offline shell.

Regression coverage: `test_local_state.mjs` tests the common record contract; `test_local_state_browser.mjs` exercises all seven actual consumer validators and the AF1/AF2/AF3 UI paths. Existing Reader continuation tests now explicitly require malformed records to survive unchanged, rather than expecting destructive recovery. Existing module, offline, navigation and translation checks remain required.

## Remaining completion boundaries

R2–R9 and adopted translation workstream L1 retain their audited DONE conditions. In particular, source preparation is not festival-review approval, Chromium emulation is not an actual Android/iOS install observation, authored translations are not native-language acceptance, and successful CI is not staging approval. None of those states is silently marked complete by this repair.
