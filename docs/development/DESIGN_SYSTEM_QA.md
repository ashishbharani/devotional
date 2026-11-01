# Shared design and enhanced-reading contract

The approved maroon/gold/ivory identity, hero, portraits, header, six navigation
destinations and existing page composition remain the baseline. Do not introduce
a parallel token palette or replace artwork to satisfy an audit.

| Contract | Existing owner |
| --- | --- |
| Paper, ink, maroon, gold and interface tokens | `abp.css`, refined by `sacred-site.css` |
| Serif/Indic fallback and interface typography | `--abp-serif`, `--abp-sans`, existing reader font stack |
| Internal ornamental surfaces and radius | `sacred-site.css`, `--sacred-radius` |
| Header, bottom navigation, safe areas and responsive geometry | `hdc-header.css`, `navigation.css`, existing navigation runtime |
| High contrast, enlarged text, spacing and no-motion preferences | `abp.css`, `abp-a11y.js` |
| Preview tools and festival controls | `practice.css`, `festivals.css`, using the same ABP tokens |

## Confirmed repair

The enhanced-reading audit found that Material's interaction accent stayed orange
in light high-contrast mode. A focused journey link had only about 3.44:1 contrast
on white. A subsequent ordinary-light interaction check exposed the same orange
at about 3.17:1 on cream. Light-mode interaction text now uses the existing darker
sacred saffron; both high-contrast modes use their existing maroon token. Resting
colours, geometry, images, fonts and breakpoints are unchanged. This is an
accessibility correction, not a redesign. The test explicitly exercises hover
and keyboard focus rather than checking only resting text.

## Reproducible audit

Build the preview and run `node scripts/test_design_system_browser.mjs`.
The audit covers library, deity catalogue, finder, Panchang, Reader, journeys,
Sanctuary and discovery at 320/768/1440px in light/dark. Each route is checked
normally and with high contrast, enlarged text, readable spacing and stopped
animation. It compares shared computed tokens, checks representative text
contrast and horizontal containment, exercises keyboard focus and verifies the
Sanctuary's reduced-motion behaviour. Screenshots and case records are retained
under `work/design-system` and uploaded by PR CI.

Computed solid-surface contrast is not a substitute for reviewing artwork,
gradients, every control state, physical assistive technology or an entire WCAG
audit. Existing header/theme/navigation and all-category tests remain required.
No pixel-identical whole-site or screen-reader certification is claimed. Wider
design review and final owner approval remain part of the coordinated release.
