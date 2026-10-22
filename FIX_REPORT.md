# Live Fix Report; onjutimeline-dashboard

Date: 2026-10-22. Branch: `metito/live-fix` (from `metito/build-optimize` 062520ac1). Scope: fix the defects found in the live audit of https://ohnahji-timeline.vercel.app (whose production deployment was built from this repo's original main, b679ebc0d) without pushing or deploying. Nothing was pushed; no remote or Vercel state was touched.

## Blocker found during QA (not in the original defect list)

**App crashed on every route.** Headless QA of the optimize branch build showed the root ErrorBoundary ("Something went wrong") on all nine slides: `useActiveAccount must be used within <ThirdwebProvider>`. Root cause: `Slide2Mint` called `useActiveAccount` and `useSendTransaction` in its own component body while returning `ThirdwebProvider` around its JSX. A provider does not cover hooks called by the component that renders it. The live source worked only because App root carried a provider; the optimize branch removed that and moved the provider inside the mint component. Because all nine slides mount simultaneously in the horizontal strip, the throw took down the whole app. Fix (06819004b): split into an outer `Slide2Mint` that renders `ThirdwebProvider` around a `Slide2MintInner` holding all hooks; the same shape the v2 repo uses. After the fix the app renders on every route with zero uncaught page errors.

## Defect 1; deep links never scrolled to their slide

Root cause: `useSlideScroll` used a fixed 600 ms programmatic-scroll lock. Multi-slide smooth scrolls run longer than that, so the lock expired mid-animation and the scroll handler hijacked navigation back toward the current slide; a second race fired the first scroll attempt while the Suspense fallback was only one slide wide, clamping the target to 0.
Fix (ce1e91c0b): ported the v2 fix (onjutimeline-fork 303e77d) verbatim. The lock now carries its target offset and is released on arrival, with a 4 s safety ceiling; the scroll effect retries at 350, 900 and 1800 ms so cold deep links land after lazy slides mount.
Evidence: headless QA against `vite preview`: all nine routes (/, /story, /genesis, /mint, /community, /art, /live, /watch, /socials) settle at exactly index times viewport width and hold after a further 2 s; a nav-dot jump from slide 0 to SOCIALS lands at scrollLeft 11520 (8 times 1440) on /socials.

## Defect 2; genesis gallery art fell back to placeholders

Root cause: the loader walked dweb.link, ipfs.io, nftstorage.link and cloudflare-ipfs.com on first error, burning the chain instantly while the leaders were only transiently rate limited, and one chain entry was dead.
Live gateway evidence (curl -4, 2026-10-22, redirects followed):
- Genesis 2372.png: pinata 200 (260,079 bytes, the only gateway that served cleanly in every run); dweb 429; ipfs.io 429.
- Okoloto 640.jpg: pinata 200 (586,266 bytes).
- Mint NoRevealHolder.png: pinata 200 (150,747 bytes) in one run, timed out in another (transient).
- Redirecting gateways vary run to run: nftstorage's 302 landed 200 (via assets.contract.metaplex.com, identical byte size) in the parent audit's run, but landed on ipfs.io with a 429 in an earlier run from the same network; w3s 301s to its own CDN host or onwards to dweb and then 429s. That variance is exactly why pinata (the consistent 200) leads the chain, the redirectors sit behind it as fallbacks, and every gateway gets retries.
- cloudflare-ipfs.com: connection failure on every test. Dead; removed.
Fix (ef593aef8): new `src/lib/ipfs.ts` with the evidence-ordered chain pinata, nftstorage, w3s, dweb, ipfs.io (CIDv0 objects never get invalid subdomain URLs) and a `ResilientImage` component that preloads through the chain: the leading gateway gets three attempts with backoff (429s are transient), later gateways two each, and the via.placeholder image appears only when every attempt has failed (marked `data-ipfs-exhausted`). Applied to NFTGalleryGrid, the genesis slide preview (which previously used dweb only), NFTDetailModal (CORS-first per gateway so colour sampling keeps working, plain fallback if CORS blocks), and metadata fetches in `useNFT`, which now use `fetchIpfs` and rotate on 429/5xx instead of depending on dweb.link alone.
Evidence: unit tests for ordering, CIDv0 handling and the attempt plan pass. The loader state machine was verified in Chromium with locally intercepted gateway responses: pinata 200 gives 9 of 9 preview images loaded from pinata; pinata 429 gives 9 of 9 loaded from nftstorage after retries; all gateways 429 gives 9 of 9 exhausted to the placeholder, and only after the full retry plan.
Caveat: gateway variance applies to metadata too. One test returned a 404 for 2372.json on pinata, but the repeat run returned 200 application/json (1,737 bytes) from pinata, so the CID is reachable through the lead gateway and the 404 reads as transient. In the same period the public gateways answered metadata requests from this network with a 429 "gateway is switching to a service worker gateway" notice, so trait data can still flicker until those rate limits lift; the loader now does everything client-side code can do about it (the chain rotates past a 404 just as it retries past a 429). Sandbox Chromium has no internet egress (ERR_TUNNEL_CONNECTION_FAILED on every external host), so real-art browser verification was done by request interception locally plus the curl evidence above, not by loading live gateways in the browser.

## Defect 3; mint slide image broken

Root cause: the mint placeholder image was hard-coded to a single dweb.link subdomain URL, the gateway that was 429ing.
Fix: routed through `ResilientImage` with the mint placeholder CID; the gateway tests above show nftstorage serves this CID with a 200 and pinata normally does too.

## Defect 4; Art slide Okoloto images broken

Root cause: the three Okoloto cards pointed straight at ipfs.io, which was returning 429.
Fix: Okoloto artworks now carry `{ cid, path }` (CID Qmdaiju45QxWibywnWftvKQgxPy1TJxBuGEUQa4Fevv9Sf) and render through `ResilientImage`; pinata serves this CID with 200s. Elemnts Arweave images and all OpenSea links are unchanged.

## Defect 5; YouTube embeds dead on Live and Watch

Root cause: playlist PLvmAix5Xj5Hk2rYwg2T0H-eMXdDbqSMH9 no longer exists. YouTube oEmbed for it returns 404 and its page title is "undefined"; the embed player rendered "This video is unavailable".
Diagnosis: the @ohnahji channel page gives channel ID UC2jADEyzHMKOA9KuywmKqDQ. Its uploads playlist (UU2jADEyzHMKOA9KuywmKqDQ) verifies live: oEmbed returns 200 with title "Uploads from Ohnahji University Network", author @ohnahji, and a current video thumbnail; the playlist page itself returns 200. Both candidate embed URLs return 200 without an unavailable marker in their shells (full player behaviour cannot be executed from this sandbox; see caveats).
Fix (13404e026): Watch slide (past streams) now embeds the verified uploads playlist. The Live slide YouTube tab now uses the channel live_stream embed for UC2jADEyzHMKOA9KuywmKqDQ, and its footer gains a prominent OPEN ON YOUTUBE button linking to youtube.com/@ohnahji/streams. The dead playlist ID is gone from the codebase.

## Defect 6; supply inconsistency (5,094 minted vs search cap 5,064)

Root cause: NFTGallery silently capped at totalSupply minus REVEAL_BUFFER (30), an intentional protection for unrevealed art, while the genesis and hero copy shows the full on-chain supply from useStore. 5094 minus 30 is exactly the mysterious 5064.
Fix (f3164cdc9): the buffer stays, but the UI is now honest about it. The gallery carries a caption ("REVEALED ART #1 to cap OF total MINTED; FINAL 30 STAY HIDDEN UNTIL REVEAL"), the search placeholder says "revealed", an over-range search explains the token is not revealed yet, and gallery page windows clamp inside the revealed range so browsing can no longer surface the protected tail tokens that search excluded.

## Defect 7; minor items

(a) Hero SCROLL TO EXPLORE toggle did nothing. It is now a real button that navigates to the Story slide, with hover states; QA verified the click lands on /story at slide index 1.
(b) Socials nav dots "without the yellow pill container": not reproducible in this codebase. NavigationDots is a single global component rendered once in App for every slide; QA measured the same pill (background rgb(22, 22, 22), 9 dots) on Socials as elsewhere, and the Socials screenshot shows the same dark pill with its SOCIALS tooltip. No per-slide divergence exists to unify; the gold element on that slide is the Milestones panel, which is slide content, not navigation.
(c) Story slide affordance: below the lg breakpoint the four chapters stack inside the slide's inner scroller with the fourth below the fold and no hint. Added a subtle animated "Scroll for all four chapters" hint visible only on those viewports; verified visible at 390 by 844. On desktop all four cards render in one row.
(d) Okoloto #003 label vs ART nav tooltip: at 1440 by 900 the measured bounding boxes do not overlap (the label sits in the second row, horizontally clear of the centred tooltip), but the tooltip band projects 36 px above the pill and the label can pass under it when the slide's inner scroller is at the bottom on shorter viewports. Added bottom clearance (pb-14) to the Art slide so the bottom-row labels stop short of the tooltip band (4f3c090b4).

## Verification summary

- `npx tsc -b`: clean.
- `npm run build`: succeeds (entry 344.64 kB, thirdweb stays code-split in its lazy chunk).
- `npx vitest run`: 21 of 21 tests pass (16 pre-existing plus updated constants tests and 4 new ipfs tests). `npm run lint`: 0 errors, 1 pre-existing react-refresh warning in useStore.tsx.
- Headless QA (Playwright library, sandbox Chromium 1248) against `vite preview`: all deep links settle and hold; hero toggle and long dot jump verified; embeds carry the new URLs; the fallback link is present; zero uncaught page errors. Console noise is limited to ERR_TUNNEL_CONNECTION_FAILED for external hosts, which is the sandbox's lack of browser egress, not the app. Screenshots and logs are in QA/ (gitignored): hero routes, genesis, gallery, mint, art, live-youtube, watch, socials, story desktop and mobile, plus qa-output.txt and qa-loader-output.txt.
- Remaining sandbox limits, honestly: live gateway responses cannot be loaded inside sandbox Chromium at all, so art verification rests on the curl evidence and the intercepted-response loader tests; the YouTube live_stream embed's in-player behaviour when the channel is offline could not be executed here, though its URL form is the standard channel embed and the uploads playlist (Watch) is oEmbed-verified.

## Commits on metito/live-fix

- ce1e91c0b fix(scroll): target-aware programmatic scroll lock plus deep-link retries
- ef593aef8 fix(ipfs): resilient gateway loader for all NFT art and metadata
- f3164cdc9 fix(gallery): make the supply cap honest (defect: 5094 vs 5064)
- 13404e026 fix(youtube): replace deleted playlist embeds with verified ones
- 2a3822c7a fix(ux): hero scroll toggle navigates; story gains a scroll hint
- 06819004b fix(mint): provider wraps an inner component so hooks are covered
- 4f3c090b4 fix(art): bottom clearance so card labels clear the nav tooltip
