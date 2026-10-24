# Chrome Sync Report; mobile chrome polish round

Branch `metito/target-ui-fixes`, built on HEAD a8121e3 (the build live in production). Scope: the app shell chrome only. No slide content, routes, order, scroll-lock behaviour or data code changed. Not pushed, not deployed.

## What the user asked for

Reviewing the live site on his iPhone in Safari (browser mode, not installed), the user asked for three things: the dock and header elements should sit in the footer and header zones over the page background colouring; the header and footer should change colour on swipe in tandem with the main page; and the whole thing should feel like a real, polished web app. His screenshots also showed two defects: Safari's floating bottom toolbar covered the lower part of the gold nav dock, and the active-slide name chip (the black ONJU pill) floated at the left edge above the dock, looking stray and nearly clipped.

## R1. Chrome tint sync; continuous level achieved

How it works now:

* The shell element (the flex column that contains the progress strip, the slide viewport and the nav footer) is a `motion.div` whose `backgroundColor` is a framer-motion `useTransform` of the deck's existing `scrollProgress` MotionValue over the twelve `SLIDE_HEX` colours, with input stops at `i / 11` so stop i is exactly slide i fully in view.
* `scrollProgress` is driven by real scroll events on the native snap container in `useSlideScroll`, so the tint tracks finger drags, wheel steps, dot-click smooth scrolls and deep-link settles alike, frame by frame. Mid-swipe, the header strip, the footer zone and the page background around the viewport are the exact interpolated blend between the outgoing and incoming slide colours.
* `document.body` background is kept on the same interpolated value through `useMotionValueEvent`, so overscroll and browser-chrome blend areas match too.
* The theme-color meta tag still updates to the settled slide's hex on every slide change, so the browser's own chrome tint follows on settle.
* The dock pill, the MINT and CONNECT pills, the progress strip and the slide nameplate keep their existing designs and float over the tinted zones; the zones carry the tint, so there is no contrasting band anywhere. No new colours; every tint comes from the existing slide palette.
* The old mechanism (a per-slide Tailwind background class on the shell plus a 500ms CSS colour transition, switching only when the settled index flipped) is removed; `SLIDE_BG` is gone. The CSS transition had to go with it, because framer already updates the value every scroll frame and a transition would smear that behind the swipe.

Why continuous was achievable here: the deck is a real scroll container with an observable scroll fraction, so no scroll-system surgery was needed; the interpolation rides the same MotionValue that already drives the progress bar. One nuance worth knowing: framer-motion mixes colours with its own colour mixer rather than a naive per-channel RGB lerp, and the blend travels the short hue path (maroon warms through a deep amber toward gold). The QA oracle below confirms the shell colour equals framer's interpolation output bit for bit at sampled fractions; the blend is a deliberate, smooth path between the two palette colours, never a third colour.

Desktop: the same sync applies (it looks better there too) and no desktop layout geometry changed; only the shell's background source changed. Desktop footer bottom padding measures 12px before and after.

## R2. Browser-mode dock occlusion fix

* The footer's bottom padding now comes from a `.dock-footer-pad` utility in `src/index.css`. Base rule, verbatim from the shipped CSS: `.dock-footer-pad{padding-bottom:calc(.75rem + env(safe-area-inset-bottom))}`, which is exactly the Part B formula the footer previously carried inline.
* Browser-mode override, verbatim from the shipped CSS: `@media(display-mode:browser)and (max-width:767px){.dock-footer-pad{padding-bottom:88px}}`.
* Reasoning for 88px: in iOS Safari browser mode the floating toolbar overlays roughly the bottom 66 to 76px of the viewport (bar height plus its bottom offset) and the page reports a 0 bottom safe-area inset there, which is why the dock sat inside the overlay. 88px lifts the dock so its full body, its 6px black outline and the bottom edge of its 8px neo shadow all clear a 76px overlay zone with margin, at both 390px and 430px widths, without opening a cavernous gap. The strip below the dock is painted by the shell's slide tint, so the footer still reads as one continuous surface, as the toolbar-band screenshot shows.
* Standalone is structurally untouched: an installed PWA does not match `display-mode: browser`, so only the base rule can ever apply there, and the max-width guard keeps the lift off desktop and tablet widths as well.

## R3. Slide-name chip; riveted nameplate

* The label no longer hangs off whichever dot is active (the source of the edge clipping and the stray look). It is now a single chip rendered once, centred horizontally on the dock pill and straddling the pill's top edge like a nameplate: absolutely positioned at the top centre of a relative wrapper around the pill, translated up by half its own height.
* Styling is unchanged 43fu: black pill, gold text, 10px black-weight type, thin black border, small neo shadow. It pops subtly (opacity and scale, 250ms) when the slide changes. The dot buttons keep their aria-labels, so the chip is decorative and aria-hidden.
* Measured at 390px on the first slide (ONJU) and a middle slide (LIVE): chip centre x = 195px, exactly the viewport centre; left and right edges fully inside the viewport; chip vertical centre coincides with the pill's top edge (704px for both), confirming the rivet placement on both slides.

## QA evidence

Harness: `QA/qa-chrome-sync.mjs` and `QA/qa-chrome-sync-2.mjs` against the production build (`npm run build`, `vite preview` on port 4183), headless Chromium, iPhone emulation. Screenshots under `QA/chrome-sync/` (gitignored, as before). The publicnode RPC was stubbed to the verified 5097 response so network variance could not pollute the runs, as in earlier rounds.

* Resting tint, all 12 routes, 390x844 and 430x932: the shell computed background equals the slide colour exactly on every route (maroon, gold, pink, white and black slides all verified, including hero, story, genesis and socials); every route settles on its own index (deep links intact); the theme-color meta equals the active slide's hex on all 12 routes; zero uncaught page errors; no horizontal overflow anywhere. Screenshots: `QA/chrome-sync/chrome-390/` and `QA/chrome-sync/chrome-430/` (hero, story, genesis, socials in each).
* Continuous blend: with scroll snap temporarily frozen in the harness only (the colour path under test, scroll events into scrollProgress into the transform, is untouched), the deck was parked at swipe fractions 0.2, 0.4 and 0.5 between hero and story. The shell colour matched framer-motion's own interpolation oracle bit for bit at all three fractions: rgb(120, 88, 16) at 0.2, rgb(159, 124, 16) at 0.4, rgb(176, 139, 16) at 0.5, between maroon rgb(60, 0, 16) and gold rgb(241, 196, 15). A separate poll during a real dot-click settle animation also sampled distinct intermediate colours, confirming the blend rides the settle animation and not just parked positions. Screenshots: `mid-swipe-40.png` (the user's exact mid-swipe scenario; header strip and footer zone both show the blend while hero and story sit side by side) and `mid-swipe-50.png` (taken a beat later, after the settle completed onto story).
* Toolbar occlusion: a simulated Safari toolbar band (66px bar, 10px bottom offset, 76px total overlay zone) was injected over the live page at 390px. The dock pill's bottom edge measured 756px in an 844px viewport; pill plus its 8px shadow reaches 764px, above the band's top edge at 768px, so the whole dock renders clear of the overlay. Footer bottom padding in browser mode measured 88px at both phone widths. Screenshot: `toolbar-band-hero.png`.
* Standalone spacing: a true standalone render is not producible in this sandbox (CDP media emulation accepts a display-mode override but this Chromium build ignores it in matchMedia, and launching with the app flag still reports browser mode), so standalone is verified by cascade instead. The shipped CSS shows the 88px lift exists only inside the browser-mode, phone-width media query, and the base rule is the original Part B formula byte for byte. The base cascade was also measured directly: with the override out of scope and a CDP safe-area override supplying a 34px home-indicator inset, footer bottom padding resolved to 46px (0.75rem + 34px) and the dock cleared the viewport bottom by exactly that, which is the same arithmetic Part B verified on the previous build. In short, the installed app keeps its previous spacing exactly; nothing ballooned.
* Regression suite: `tsc -b` clean; `npm run build` succeeds; vitest 21 of 21 pass, including the six NavigationDots tests (button count, labels, aria-current, click routing, nav landmark), which pass unchanged against the restructured dock. Desktop spot check at 1440x900 on /story: gold shell tint, footer padding 12px, theme-color #F1C40F, zero errors. Screenshot: `chrome-desktop-story.png`.

## Honest limits

* The browser-mode lift assumes the current iOS Safari floating-toolbar geometry; if Apple materially changes the toolbar's height or offset in a future iOS, the 88px value may need a revisit. It is a single named value in one CSS rule.
* Physical-device confirmation still rests with the user's phone, as with Part B: the sandbox cannot run real Safari or a real standalone install. The two things to eyeball after deploy are the dock clearing the real toolbar in Safari, and the footer spacing in the installed app.
