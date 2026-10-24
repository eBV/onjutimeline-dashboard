# Desktop Review Round: Report

Date: 2026-10-23 (built and deployed 2026-10-23/24 PT)
Branch: metito/target-ui-fixes, local commit 4459bda on top of 0b3b2a3 (chrome-sync polish)
Deployed: snapshot commit db3dde4348bd9188cf8c031781a7ff9caa1a062a plus delete commit 915b00ed19c886b758165a96219242ed02611865 on eBV/onjutimeline-dashboard main
Production deployment: dpl_ErLqnAazBhNjGk6ccn5CFEZbWqyJ (READY, commit 915b00e); the snapshot commit's own deployment dpl_H92mvTHNHqQiiYQyUnLypAxkvqcT is also READY
Site: https://ohnahji-timeline.vercel.app

## 1. Holder-gated deck

Done. Deck composition now lives in one module, src/lib/deck.ts: BASE_SLIDES (/, /story, /genesis, /mint, /community, /art, /merch, /live, /lens, /socials) and GATED_SLIDES (/vault, /firstlook), with visibleSlides(isHolder) as the single derivation. The holder check was hoisted into src/hooks/useHolderStatus.tsx (HolderProvider wraps the app): one React Query keyed ['og-balance', address] doing the same publicnode eth_call balanceOf read the Vault used before; SlideVault now consumes that shared state instead of its own fetch. Disconnected, checking, and error states all resolve to not-holder, so the gated slides are hidden by default. Everything index-based derives from the visible deck: NavigationDots takes slideNames as a prop; the chrome tint useTransform stops recompute as i/(n-1) over the visible deck; theme-color follows the visible deck; deep-link resolution and scroll logic use the same slidePaths array.

Deep links: /vault and /firstlook while not a proven holder land on / (verified in the headless suite for both paths, plus /watch). Two timing guards make holder deep links work on cold loads: the redirect waits while the holder state is pending (session restore via useIsAutoConnecting, or the balanceOf read in flight), and gated paths get a 3 second grace window from first paint because at first paint neither signal has started yet. Both were necessary; without them a returning holder was bounced home before the session landed. A related scroll fix shipped in useSlideScroll: programmatic jumps of more than two slides now snap instantly and the navigation lock ceiling scales with distance, because an 11-slide animated sweep could outlast the old fixed lock and the scroll handler then hijacked navigation to an intermediate slide (observed resting state was slide 8 of 11 before the fix).

Mid-session flips: connecting a holder wallet grows the deck from 10 to 12 dots with no reload and without moving the user off the current slide (verified end to end with a stubbed injected wallet; the deck also shrinks back on disconnect by the same derivation).

## 2. First Look tab (/firstlook, holder-only)

Slide added with nameplate FIRST LOOK; background is the brand burgundy (bg-ohnahji-burgundy, #3C0010 family) from the existing palette. Two embed panels in the site neo-card styling, each a responsive 16:9 iframe with a title, a one-line description, and an OPEN FULL SCREEN link.

Embed A, Alphites stadium: curl on 2026-10-23 showed https://alphite-stadium.vercel.app returns 200 with no X-Frame-Options and no CSP frame-ancestors, so it is embedded directly in an iframe.

Embed B, the campus: this needs a correction to the brief. The brief pointed at Four Corners Campus v5 (four-corners-campus-v5.html) as the build carrying the reversed-controls bug. Empirical headless measurement proved v5 is CORRECT on every input path (see the table below), so flipping anything in v5 would have created the bug. The reversal actually lives in the newer merged build in the same goal folder, four-corners-in-dakar-v8.html (modified 2026-10-23 01:29), which has its own walk mode: its movement basis computed the right vector as rx=fz, rz=-fx, exactly negated versus the correct rx=-fz, rz=fx. The fix was applied to that canonical file and to the embedded copy; v5 was left byte-identical (md5 050b0e1140b4ab081932b2b3533a35f7). Because the Dakar v8 build is the newest campus build and the one carrying the reported bug, it is the one embedded, served same-origin at /firstlook/campus.html (691,472 bytes; it survived the production build and the connector push; remote blob SHA 52dce1963deff6442f6bcfc6655600c21838912a matches the local file, and the live URL's sha256 0c62027427ce1e87d37f4a8438c730a441cab422879b5efce39c73b682d913b9 matches too). Panel title: Four Corners Campus: Dakar.

### 2a. Controls diagnosis, measured headlessly (Playwright, real renderer, scripted inputs; displacement dotted against the camera right vector)

Four Corners Campus v5, before any change (no change made):
- Third person: KeyD dotRight +0.55; KeyA dotRight -0.55; KeyW dotFwd +0.55
- First person: KeyD dotRight +0.55; KeyA dotRight -0.55
- Joystick right: dotRight +3.91; drag right: view pans right, consistent with its orbit mode
Verdict: correct everywhere; the reported bug is not in v5.

Four Corners in Dakar v8, BEFORE the fix:
- Third person: KeyD dotRight -0.55 (wrong side); KeyA dotRight +0.55 (wrong side); KeyW dotFwd +0.55 (forward fine)
- First person: KeyD dotRight -0.55; KeyA dotRight +0.55
- Drag right: azimuth delta -0.78, same convention as v5; drag look was always correct

Four Corners in Dakar v8, AFTER the one-line fix (rx=-fz, rz=fx, line 1191):
- Third person: KeyD dotRight +0.55; KeyA dotRight -0.55; KeyW dotFwd +0.55 (unchanged)
- First person: KeyD dotRight +0.55; KeyA dotRight -0.55
- Drag right: azimuth delta -0.78 (unchanged)
The joystick was not knob-measured on v8; it feeds the same mx input the key measurements cover (joyVec.x is added into mx, which multiplies the fixed basis), so it is corrected by the same line. Forward, back, and pitch behavior are untouched. Earlier Dakar versions (v1 to v7) were not audited and presumably share the bug; they are out of scope.

## 3. Socials rework

Done. The bottom Discord CTA block is deleted. The grid is now a centered flex-wrap of 11 cards, vertically centered in the slide: Discord first (https://discord.com/invite/3ahyqHkhc7), then X, Instagram, Threads, YouTube, Twitch, Kick (https://kick.com/ohnahji, brand green #53FC18 card with a K glyph), Reddit (https://www.reddit.com/r/Ohnahji/, brand orange #FF4500 card with an r/ glyph), Lens (Orb link), OpenSea, and the Etherscan contract link. Farcaster is removed. The anti-phishing line is kept. Mobile stacks two per row and scrolls inside the slide as before.

## 4. Watch slide removed

Done. src/features/watch/Slide6Watch.tsx is deleted locally and remotely (remote delete commit 915b00e). The deck module has no /watch entry; greps across src find no route, link, or chunk for it (remaining hits are the word watch in Live-slide prose). The production bundle confirms it: the served chunk list has SlideFirstLook and SlideVault and no Slide6Watch chunk, and the entry contains no "/watch" path. Deep-linking /watch lands on /.

## 5. Lens background to maroon

Done. The lens entry in deck.ts is hex #3C0010 with the bg-ohnahji-burgundy shell class; the chrome tint follows automatically through the same meta. The headless suite measured the rendered slide panel background as rgb(60, 0, 16). Lens-green accents inside the slide (the LENS CHAIN chip, follow button styling) are unchanged.

## 6. Art slide cards smaller on desktop

Done, scoped to lg and up: card images switch from aspect-square to a fixed lg:h-[23vh] with lg:aspect-auto, the header and paddings compact at lg, and mobile rendering is untouched. Headless measurements: at 1440x900 all 6 cards present, second row bottom at 756.7px against an 816px limit; at 1280x800 second row bottom at 683.7px against a 716px limit; no scroller overflow at either size. Screenshots in QA/desktop-review/desktop-art-1440.png and desktop-art-1280.png.

## Build and QA

- npx tsc -b clean; npm run build OK; production entry index-BwZ0yXPQ.js locally.
- vitest: 34 of 34 passing across 6 files, including new deck.test.ts (base order, no /watch, gated append order, lens maroon) and useHolderStatus.test.tsx (disconnected, zero balance, positive balance, RPC error), plus NavigationDots tests for 10 vs 12 dots.
- Headless QA harness (QA/desktop-review/qa.mjs) against the production dist with stubbed RPC, Lens API, and wallet: 33 of 33 checks passed, zero uncaught page errors. Coverage: base deck and deep links, art fit at both desktop sizes, lens maroon with a fixture post, all socials assertions, gated and stale deep-link bounces, iPhone 390 deck and socials, the full holder flow (connect via the thirdweb modal, deck grows 10 to 12, vault holder state with the stubbed balance, cold-load /firstlook settling on slide 11 after session restore, both iframes present, campus frame booted with canvas and THREE).
- Screenshots: QA/desktop-review/ (desktop-socials, desktop-lens-maroon, desktop-art-1440, desktop-art-1280, iphone-hero, iphone-socials, holder-vault, holder-firstlook, holder-firstlook-cold).

## Deployment verification (production, after READY)

- Served entry index-D2HI2bqZ.js is byte-identical to the local build's entry after hash normalization (sha256 8743fbbe6df5638d both sides).
- Routes /, /story, /genesis, /mint, /community, /art, /merch, /live, /lens, /socials all return 200 (SPA shell; gated and stale paths also serve the shell and are routed client-side, as designed).
- GET /api/twitch returns real data (channel ohnahji, id 907992368, current VOD list), not the unavailable shape.
- https://ohnahji-timeline.vercel.app/firstlook/campus.html returns 200 with sha256 identical to the fixed local file; https://alphite-stadium.vercel.app returns 200.
- Bundle chunk list contains SlideFirstLook (with both embed targets inside) and SlideVault; no Watch chunk.

## Honest limits

- All rendering QA ran headless under SwiftShader at roughly 1 fps; every assertion is DOM-measured, and compositor screenshots of WebGL-heavy states can lag the true DOM state in this environment. The campus control measurements were taken from hero and camera state, not pixels.
- The Grove Vault holder flows (upload, unlock) are still verified by code only; the first real wallet signature test remains open from the earlier rounds, as does the manual upload of the three regenerated PWA icons.
- The holder gating was proven with a stubbed injected wallet and stubbed RPC, not with a real wallet against production; the balance read itself is the same publicnode pattern the Vault already used live.
- The deck grace window means a non-holder who deep-links /vault or /firstlook waits up to about 3 seconds on the home slide before the URL settles to /; that is the deliberate trade for letting returning holders land on their gated slides.
