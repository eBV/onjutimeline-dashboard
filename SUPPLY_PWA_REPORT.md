# Supply honesty (Part A) and PWA / iPhone layout (Part B)

Branch `metito/target-ui-fixes` on the reconstructed 43fu UI. Part A commit `8045073`; Part B commit `3be82f5`. Nothing pushed or deployed. Prose uses semicolons in place of em dashes throughout this work.

## Part A: minted supply 5,097, made robust and honest

The parent verified onchain on 2026-10-22 that `totalSupply()` on the OG contract `0xbef648e3034e80efe152f3581117c1536fff5afc` is now 5,097 (up from 5,094), that the site's endpoint `ethereum-rpc.publicnode.com` returns it with CORS `*`, and that token 5067 and 5097 art and metadata exist on the genesis and metadata CIDs via Pinata.

### Findings before the fix

- `src/hooks/useStore.tsx`: the supply query had no `initialData`, so the UI flashed its fallback first; `fetchTotalSupply` returned 1000 on an unparseable or non-positive result, and consumers applied `supply > 0 ? supply : 1000`.
- `src/features/genesis/Slide1Genesis.tsx`: preview sampling fell back to `totalSupply || 8888`, so a failed fetch could surface the bogus 8888; the minted line printed the raw number.
- `src/components/NFTGallery.tsx`: `maxToken` was derived from the supply, but comments still cited 5,094 and 5,064 as if current.

### Fixes (commit 8045073)

- `useStore.tsx`: exported `LAST_KNOWN_TOTAL_SUPPLY = 5097` with a comment recording that it was verified onchain on 2026-10-22 and that the live read self-corrects it. The query uses `initialData: LAST_KNOWN_TOTAL_SUPPLY` with `initialDataUpdatedAt: 0`, so React Query treats the value as stale and replaces it with the live chain read on mount; a failed fetch keeps the last-known value instead of a bogus one. No 1000 flash can occur.
- `fetchTotalSupply` now throws on a non-positive or unparseable result instead of returning 1000.
- `Slide1Genesis.tsx`: the 8888 fallback is gone; preview sampling uses `Math.max(1, totalSupply)`; the minted line renders `totalSupply.toLocaleString()` ("5,097 NFTs minted").
- `NFTGallery.tsx`: derives `supply = Math.max(0, totalSupply)` and `maxToken = Math.max(1, supply - REVEAL_BUFFER)` from one place, used by paging, navigation clamping, search and the caption; the caption renders both numbers with `toLocaleString`. The `REVEAL_BUFFER` of 30 design is unchanged, so at supply 5,097 the revealed range is #1 to 5,067 automatically. Comments now cite 5,097 and 5,067.
- Repo-wide grep after the fix: the only remaining `8888` is `src/__tests__/constants.test.ts`, where 8888 is an arbitrary token ID fixture for `getNFTImage`, not a supply assumption; it was left as is and is flagged here. No other 5094, 5064 or 8888 supply assumptions remain in `src`, `index.html`, `public` or the tests.

### Verification

- `npx tsc -b` clean; `npm run build` succeeds; `npx vitest run` 21/21 pass.
- Headless QA (`QA/qa-supply-pwa.mjs`) intercepted the publicnode RPC with result `0x13e9` (5097): the genesis line reads "5,097 NFTs minted"; the gallery caption reads "REVEALED ART #1–5,067 OF 5,097 MINTED; FINAL 30 STAY HIDDEN UNTIL REVEAL"; the search placeholder reads "#1–5067 revealed" and the input max is 5067; zero page errors.
- A second run with the stub returning 6000 rendered "6,000 NFTs minted" and a 5,970 of 6,000 caption, proving the number self-corrects from chain rather than being frozen at 5,097.

## Part B: PWA and fullscreen header/footer on iPhones

### Audit

- `index.html` was already correct and was left as is: the viewport meta includes `viewport-fit=cover`; `theme-color` is the maroon `#3C0010`; `apple-mobile-web-app-capable` is yes; the status bar style is black-translucent; `apple-mobile-web-app-title` is OHNAHJI; the apple-touch-icon and manifest links are present.
- `public/manifest.json` was nearly complete (name, short_name OHNAHJI, start_url "/", display standalone, background and theme `#3C0010`, orientation portrait, 192 and 512 icons with "any maskable" purpose). One gap: no explicit `scope`; added `"scope": "/"`. Display stays standalone, which is the correct mode for this app; fullscreen would hide system UI the design does not replace.
- Icon defect found: `public/icon-192.png`, `public/icon-512.png` and `public/apple-touch-icon.png` carried a nonstandard 14-byte PNG IHDR chunk (the spec is 13). Their CRCs were computed over the bad length; lenient decoders tolerated them, strict ones rejected them. All three were regenerated from the same decoded pixels as standard PNGs; pixel SHA-256 hashes are unchanged (icon-192 fbbce0a5…, icon-512 0d01bc2c…, apple-touch b8d860b2…), sizes are now 2317, 10894 and 2036 bytes at 192x192, 512x512 and 180x180, IHDR length 13. The icons are fully opaque maroon with the logo inside the maskable safe zone. `favicon-16/32` and `ji.png` were already standard and untouched.
- The shell used `h-dvh` with no fallback for older iOS, and no element respected the safe-area insets: on a fullscreen iPhone the footer nav could sit under the home indicator and the fixed CONNECT button could crowd the notch in landscape.

### Fixes (commit 3be82f5)

- `src/index.css`: new `.h-app-shell` utility layer rule, `height: 100vh` with an `@supports (height: 100dvh)` override to `100dvh`. Note: a first attempt as a Tailwind `@utility` with two height declarations was collapsed by the CSS optimizer to only the dvh rule; the `@supports` structure was verified present in the compiled CSS with both rules.
- `src/App.tsx`: the root shell uses `h-app-shell w-full` (was `h-dvh w-screen`) with top, left and right padding from `env(safe-area-inset-*)`; the fixed CONNECT wrapper (now the MINT plus CONNECT row after Part C) offsets with `calc(0.75rem + env(safe-area-inset-top))` and the matching right inset.
- `src/components/NavigationDots.tsx`: the footer wrapper pads left and right with `calc(1rem + env(safe-area-inset-*))` and bottom with `calc(0.75rem + env(safe-area-inset-bottom))`, so the gold pill clears the home indicator.
- `src/features/genesis/Slide1Genesis.tsx`: the gallery overlay pads all four sides with the insets; its BACK button offsets by the top and right insets.
- `src/components/NFTDetailModal.tsx`: the overlay pads all four sides with `calc(0.75rem + env(safe-area-inset-*))`.
- `public/manifest.json`: added `"scope": "/"`.

### Verification

- `npx tsc -b` clean; `npm run build` succeeds; `npx vitest run` 21/21 pass.
- Manifest and icons over HTTP from the production build: manifest 200 with all expected fields including scope; every icon 200 with correct dimensions and IHDR length 13; the served HTML carries `viewport-fit=cover`, the maroon theme-color, the Apple metas and the touch icon.
- iPhone emulation in headless Chromium (explicit 390x844 and 430x932 viewports; the Playwright iPhone 13 descriptor defaults to a shorter 390x664 viewport, so explicit sizes were used; DSF 3, touch, mobile UA): on every route the slide index settles correctly, the shell height equals `innerHeight`, the footer wrapper bottom equals the viewport height, the nav pill sits 12px above it, there is no horizontal overflow, the per-slide theme-color is correct, and there are zero page errors. Screenshots per slide per size are in `QA/iphone-390/` and `QA/iphone-430/`.
- Safe-area simulation: the sandbox Chromium accepted CDP `Emulation.setSafeAreaInsetsOverride`, so the real `env()` code paths were exercised rather than a style stand-in. The env probe read top 47px and bottom 34px; on the hero at 390x844 the nav pill's bottom gap measured 46px (12px base plus the 34px inset) and the progress strip top measured 47px. Screenshot: `QA/iphone-safearea-hero.png`.

### Honest limits

- Chromium emulation approximates iOS Safari; it is not Safari. Physical-iPhone standalone behavior, including the actual home-indicator inset values on real hardware, Safari's URL-bar dynamics outside standalone mode, and the real Add to Home Screen install flow, is verified only by code inspection and the standards-conformant markup above, not executed on a device.
- The codebase has no service worker; nothing in the audit scope asked for one, and offline behavior is unchanged.
