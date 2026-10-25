# Site fixes wave 2 (2026-10-24, late evening)

Branch `metito/site-fixes-2`, from `metito/target-ui-fixes` at `ab949c4`
(wave deploy). Four user-reported items, all verified in browser QA on the
production build before deploy. No em dashes in this file by rule.

## Item 1 (sitewide, highest priority): nav labels still not on the dot

Diagnosis, with evidence. The measurement code from the nameplate fix IS in
the merged tree (`src/components/NavigationDots.tsx`: real-dot measurement,
`offsetWidth`, 2px edge clamping) and the production entry bundle DOES
contain the component (aria-labels, `dock-footer-pad` strings present in
`index-Bj4QegNM.js`). The production bundle hash DID change with the wave
deploy (`CmAtf0BZ` to `Bj4QegNM`), and the production site-config deck is
correct: Story and Community hidden, vault/firstlook OG-gated, so a
logged-out visitor sees exactly the 10 dots in the user's screenshots.
Measured directly on the user's Genesis screenshot: label center x=500,
active dot x=263 (normalized 0-1000), an offset of about 92 CSS px, i.e.
the label sits on the strip center, which is exactly the pre-fix fallback
(`left: 50%`) behavior. Reproduction on the merged production build passes
everywhere: dot clicks, swipe-driven navigation, 390px and 412px, immediate
and after 3s, all offsets 0.0. Cache headers are `max-age=0,
must-revalidate` and the service worker is network-first for navigations,
so a reload always fetches fresh code; the remaining consistent explanation
for the user's phone is a long-lived tab opened before the nameplate deploy
and never reloaded (Android Chrome keeps tabs for days, and no
`skipWaiting` means a new worker never refreshes an open page).

Fix, so the label cannot drift again whatever the JS path does: CSS anchor
positioning is now the PRIMARY placement. The active dot carries
`[anchor-name:--active-dot]` and the label carries
`[position-anchor:--active-dot] left-[anchor(--active-dot_center)]`, so the
browser pins the label to the dot's center in pure CSS. The JS measurement
is kept as the fallback for browsers without anchor support; on
anchor-capable browsers the effect skips setting an inline left (an inline
left would beat the anchor rule). All three anchor rules verified in the
compiled CSS. Unit test added: anchor-capable browsers skip the JS inline
left; the existing JS-fallback tests still pass in jsdom (no anchor
support there).

Browser QA (production build, 390px): anchor support true in Chromium;
Genesis label offset 0 with NO inline left; Quotes label offset 0 with NO
inline left. The anchor path, not the JS path, placed both labels.

Standing owner check: after this deploys, fully close and reopen the tab
(or hard reload) once; a tab carried over from before the nameplate deploy
runs old code no new deploy can reach. After a fresh load the label sits on
the active dot on every slide.

## Item 2 (gallery view): footer color to maroon

Root cause: the gallery overlay itself was already maroon, but the BODY
behind it (painted by the chrome tint) and the shell stayed Genesis pink
while the overlay was open, and that pink shows through a translucent
Android nav bar at the viewport bottom as a pink footer strip. Fix in
`src/App.tsx`: while `isGalleryOpen`, the shell background, the body
background, and the `theme-color` meta all go maroon `#3C0010`, restoring
to the slide color on close. Scroll is already locked while the gallery is
open, so the tint listener cannot repaint pink mid-view. Browser QA
(390px): before opening, body pink `rgb(254, 81, 126)` and theme pink;
with the gallery open, body, shell, overlay, and theme-color all maroon
`rgb(60, 0, 16)` / `#3C0010`.

## Item 3 (Quotes page): filter bar background removed

`src/features/quotes/SlideQuotes.tsx`: the sticky filter bar container
went from `bg-ohnahji-pink/95 backdrop-blur-sm` to `bg-transparent` with no
blur. The filter controls themselves (white selects, burgundy labels) are
unchanged. Browser QA (390px): bar computed background
`rgba(0, 0, 0, 0)`; scrolling so cards pass beneath leaves card content
readable under the bar.

## Item 4 (sitewide): scrollbars dissolve out when idle

`src/index.css` plus new `src/lib/autoHideScrollbars.ts` (wired in
`App.tsx`). The scrollbar width stays 12px at all times so hiding never
shifts layout; idle, track and thumb are fully transparent; while the user
scrolls, wheels, touch-moves, or presses, `html.scrolling` is set and the
colors dissolve back in over a 0.6s transition. Firefox gets the same
hide/show via `scrollbar-color`, but it snaps instead of dissolving because
its engine does not transition that property (stated honestly, not
papered over). Browser QA (390px and 1440px): class absent initially,
present while scrolling, absent again after the 1s idle timeout; compiled
CSS verified by grep (12px width, 0.6s transitions, scrolling variants).
Note: Chromium does not expose `::-webkit-scrollbar` rules through the
CSSOM at all, so in-browser stylesheet introspection can never show them;
the compiled-CSS grep plus the class behavior is the evidence.

## Tests

`tsc -b` clean. Full suite 145/147; the 2 failures are the known
quotes-seed Day 433 pin (`quotes-seed`, `quotes-generator`), the cron
lane's item: the suite's own sync run writes Day 433 into the seed files,
which trips the pin. No quotes-data changes are in this branch (the files
were restored after the suite run). New tests: `autoHideScrollbars` (3),
anchor-path test in `NavigationDots` (1).

## Files

- `src/components/NavigationDots.tsx` (anchor primary, JS fallback)
- `src/App.tsx` (gallery maroon layers, scrollbar toggler wiring)
- `src/features/quotes/SlideQuotes.tsx` (transparent filter bar)
- `src/index.css` (auto-hide scrollbar rules)
- `src/lib/autoHideScrollbars.ts` (new)
- `src/__tests__/autoHideScrollbars.test.ts` (new)
- `src/__tests__/NavigationDots.test.tsx` (anchor-path test)
- `SITE_FIXES_2_REPORT.md` (this file)
