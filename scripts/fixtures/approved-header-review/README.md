# Approved HDC header staging review

Owner-supplied gateway/path design-board implementation. These are local staging
screenshots, not evidence of deployment or physical-device app installation.
Baseline: `f290e1d`. Latest upstream artwork/library changes are retained.

| View | Before | After |
| --- | --- | --- |
| Desktop | ![Original desktop](before-desktop.png) | ![Approved desktop header](after-desktop.png) |
| Mobile | ![Original mobile](before-mobile.png) | ![Approved mobile header and bottom navigation](after-mobile.png) |

![Tablet](after-tablet.png)
![Dark desktop](after-desktop-dark.png)
![Mobile menu with the clearly labelled Install App entry](mobile-menu-install.png)

The menu screenshot uses a synthetic browser installation offer to make the ready
state reproducible. It does not claim an OS installation occurred. See
`HDC_HEADER_STAGING.md` for test results, source-image limits and rollback steps.
Do not merge/deploy before explicit staging approval.
