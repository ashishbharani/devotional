# Homepage tabs: alignment review

Native Chromium screenshots at 390px and 1920px viewport widths, clipped to
the full homepage width around the four tabs (not just the tab container).
Captured 15 October 2026 with reduced motion and the same fallback fonts.

- `before-*`: public Pages homepage following merge `d6292d8`.
- `after-*`: strict-built `fix/homepage-tabs-centering` homepage.

At 1920px, the original container's midpoint was 290.06px left of its parent
midpoint. Restoring auto inline margins reduces that offset to 0px. At
390px, both versions retain symmetric gutters; the corrected buttons also
explicitly center any wrapped label lines. Links and two-column layout remain
unchanged. The main homepage browser suite checks these properties, including
the wide desktop viewport that exposed the original issue.
