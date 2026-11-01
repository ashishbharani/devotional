# Design-board fidelity review

Reference: owner's 1536 × 1024 Hindu Devotional UI Design Board. Existing
`docs/assets/images/hdc-brand/source.json` records the exact source artwork crops.

Before images capture the live homepage; after images capture this branch's
strict build at the same 1536px desktop and 390px mobile viewports. Screenshots
are review fixtures only and are not shipped as website backgrounds.

This pass uses the exact desktop wordmark rather than a separately typeset
approximation, corrects its scale, and refines controls, menu and mobile dock
proportions. The semantic brand remains available to assistive technology;
translated and enlarged-text modes retain real text.

The board is a multi-panel presentation, not a complete responsive specification.
Geometry checks and visual comparison are not a zero-pixel-difference claim.
Working category counts, disabled install state, existing icon outlines and
responsive adaptations remain functional rather than being flattened into a
picture. The menu's illustrative second column has not been fabricated as new
canonical categories or unsupported routes.

Reproduce: build with `python -m mkdocs build --strict`, then run
`pnpm exec node scripts/test_design_board.mjs` and
`pnpm exec node scripts/test_header_fidelity_browser.mjs`.
