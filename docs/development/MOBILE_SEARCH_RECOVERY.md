# Native header search and reduced-viewport recovery

The keyboard-sized viewport probe found that the header search toggle became
checked while its panel remained clipped off-screen. Material's installed CSS
uses `[data-md-toggle=search]:checked ~ .md-header` selectors. HDC's shared
navigation wrapper separated the original toggle from the header, so those
selectors could not match. At 320px the focused input was x=-72/y=-12 rather
than a usable full-screen search field. This was a DOM compatibility defect, not
an astronomical/search-ranking or provider problem.

The navigation initializer now moves the **same existing toggle node** beside
the header inside its wrapper. Its ID, listeners, state and label targets remain
intact; no duplicate input or replacement search engine is introduced. Material
continues to own search, results, Escape and routing.

Re-enabling the native panel exposed a second issue in mobile emulation: its
expanded circular backdrop increased the layout width to 1196px on a 320px
device. A scoped rule at Material's existing full-screen-search breakpoint bounds
the active backdrop to the viewport. The original colours are inherited. Resting
header, approved artwork, navigation geometry and homepage hero are unchanged.

Development-only DOM/style overrides proved both corrections at 320/375/768px
in light/dark, including real Library navigation. The first DOM-only prototype
still widened the layout; that adverse result was retained rather than described
as a complete fix. Final verification must use rebuilt source with **no overrides**.

`test_mobile_keyboard_browser.mjs` exercises the native control at five widths
in both themes, 900→430→900 viewport changes, preserved focus/query, actual native
search result links, one toggle, device-width containment, Escape, drawer recovery
and real Library navigation. CI uploads `work/mobile-keyboard`. This is a
reduced-layout-viewport regression, not a physical Android/iOS IME or every
visual-viewport/zoom configuration certification. Real device checks remain open.

The previous 42-step full run was interrupted by the owner's pause after the
search-browser step; its report is marked interrupted, not passed. The new
committed-source run has 43 steps including this regression. The source/rights,
translation backlog, reviewed festival dates and final staging-approval gates
remain in force. Do not deploy merely because this focused repair passes.
