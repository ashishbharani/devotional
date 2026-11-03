---
title: HDC Mobile Navigation Decision
---

# Mobile navigation evaluation

Scope: original DIS-01/DIS-02; implementation review on 3 November 2026. This is the required evaluation, not permission to replace the approved design. Final visual and real-device acceptance remains R7/R9.

## Compared models

| Criterion | Proposed Home / Explore / Daily / Saved / More | Approved Home / Panchang / Devotional / Library / Tools / About |
| --- | --- | --- |
| Primary catalogue discovery | Explore groups discovery methods | Devotional opens the existing complete category structure; existing search and directory remain available |
| Daily utility | Daily needs a decision between Darshan and location-sensitive Panchang | Panchang has an explicit established meaning; Daily Darshan remains on Home |
| Library | Requires More or a discovery handoff | Direct Library destination |
| Saved material | Direct Saved, but must distinguish work favourites, private Journey and section shortcuts | Existing favourites and Journey remain separately labelled in navigation; no implied account synchronization |
| Tools | Grouped in More with other destinations | Tools button opens the real existing menu rather than inventing a landing route |
| About and Help | More | Existing About destination and navigation submenus |
| Small-screen density | Five equal targets allow more width | Six targets require compact labels and adequate safe-area spacing; existing responsive regression coverage must remain |
| Existing bookmarks and learned labels | Routes can stay, but visible conventions change | Retains both routes and the owner's explicitly approved six-item design board |

## Decision

**Retain the approved six-destination model.** The alternative is viable, but there is no observed task failure that justifies moving Library and Tools behind a new More category or changing Panchang to the ambiguous Daily label. This also avoids treating favourites, section shortcuts and private notes as a single cloud-backed Saved product. Search, Explore and the preview practice tools remain reachable through existing explicit links; no canonical category is removed or hardcoded into a new abbreviated menu.

Implementation evidence: `theme/partials/hdc-bottom-navigation.html` iterates the actual MkDocs navigation. Its Tools button opens the existing section menu; other destinations use the existing first child/route. Do not replace this with a manually maintained category list. The six labels are short mobile labels; desktop navigation retains its full names.

Acceptance tasks for the frozen candidate: open each destination by touch and keyboard; use Tools as a button; reach search, favourites, Library and each preview practice path; check active state, Escape/focus return, 320/375/768 widths, theme/reduced motion, browser history and bottom safe areas. Automated navigation/header regressions are evidence for browser behavior; actual Android/iOS and owner visual observations are recorded separately in R7. This reasoned decision does not claim those observations have occurred.
