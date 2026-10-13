# Search review screenshots

Before/after captures use the same `bake bihari` query, light theme and
320px or 1440px viewport. Before captures come from the pre-search local build;
after captures come from the universal search browser suite. These are review
fixtures, not website assets. The baseline predates the subsequently merged
location and native project-information updates; neither affects this Find view.

Regenerate after captures with `SEARCH_SCREENSHOTS` set when running
`node scripts/test_search_browser.mjs`. Set `SEARCH_BASELINE_SITE` to a separately
built pre-search site to capture matching before images.
