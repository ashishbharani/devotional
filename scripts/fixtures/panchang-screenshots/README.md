# Panchanga visual review

Phone (360 px) and desktop (1440 px) captures accompany this change. `*-before-*`
shows the previous presentation; the other files show the implemented views.
These are visual evidence, not numerical reference fixtures.

| View | Before | After |
| --- | --- | --- |
| Home, phone | [Before](home-before-360.png) | [Matching collapsed menus](home-collapsed-360.png) |
| Home, desktop | [Before](home-before-1440.png) | [Matching collapsed menus](home-collapsed-1440.png) |
| Daily, phone | [Before](daily-before-360.png) | [Full timings and Muhurtas](daily-360.png) |
| Daily, desktop | [Before](daily-before-1440.png) | [Full timings and Muhurtas](daily-1440.png) |
| Monthly, phone | [Before](monthly-before-360.png) | [All transitions visible](monthly-compact-360.png) |
| Monthly, desktop | [Before](monthly-before-1440.png) | [All transitions visible](monthly-compact-1440.png) |

CI also captures expanded homepage/monthly views, 320/390/768 px widths and
light/dark themes in the `panchang-browser-screenshots` artifact.

## Moonrise/Moonset follow-up

These expanded homepage captures isolate the follow-up's two additional
existing-style astronomical tiles. Daily and Monthly retain their previous
rows and styling; the browser suite verifies their values match the homepage.

| Width | Before | After |
| --- | --- | --- |
| Phone, 360 px | [Before](moon-home-before-360.png) | [Moonrise/Moonset](moon-home-360.png) |
| Desktop, 1440 px | [Before](moon-home-before-1440.png) | [Moonrise/Moonset](moon-home-1440.png) |
