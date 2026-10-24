# QUOTES Tab; Build and Deploy Report

Built and deployed 2026-10-23 from branch `metito/target-ui-fixes` (local commit `7141dc0`), per the approved brief in `~/workspace/your_files/quotes-tab-brief.md`.

Deployed: snapshot commit `c968a199580512839f00a2abedae6e4715cf1c45` on `eBV/onjutimeline-dashboard` main.
Production deployment: `dpl_3QpgeUry9BHsxFF4Gx8yn2emUzyZ` (READY, production aliases on `ohnahji-timeline.vercel.app`).

## What shipped

- New public slide `/quotes` (nameplate QUOTES) in the base deck, after `/lens` and before `/socials`. Base deck is now 11 slides; the holder deck is 13. All index-driven systems (dots, chrome tint stops, deep links) derive from `src/lib/deck.ts` as before.
- Design: white slide (hex `#FFFFFF`) so the cards carry the colour. Cards rotate white, gold, pink, burgundy in the site neo-brutalist language (6px black borders, neo shadow, Clarity City black type), with an oversized quote mark, a DAY NNN tag, the stream date, and the source context line when the archive records one. Vote rail on the left of each card: up chevron, score, down chevron; the voter's own choice fills black with a gold (up) or pink (down) chevron. (Superseded in part by Part 7 below: the slide background is now brand pink and the card cycle drops pink.)
- Filters and sorts: weekday, month, year, and episode selects combine (AND) with a live result count and a reset; sorts are BEST (score desc), WORST (score asc), and NEW (episode desc), all respecting the active filters. The feed renders in chunks of 30 with a show-more button.
- Voting states: no wallet shows a CONNECT TO VOTE button in the slide and tapping any arrow explains the rule and scrolls to it; a connected wallet signs in once (below) and then votes in one click; the header shows VOTING AS 0x… with a sign-out once a session exists.

## Seed archive

Generator: `scripts/sync-quotes.mjs`, parsing `~/workspace/ohnahji-brand/one-liners/` (candidates files including round 2/3 files and the Day 430 overtime file, plus stylelab pick records). Inclusion follows the standing attribution rules: candidates only when the speaker confidence is plain HIGH with no relay, read-aloud, voicing-others, or do-not-attribute flag; MEDIUM, MEDIUM-HIGH, and LOW are excluded; published stylelab picks are included with their subline credit kept as the quote context; near-duplicate texts between the candidate and pick versions are merged once.

Result: **317 quotes across 19 episode days**. Per day: 413: 12; 414: 14; 415: 12; 416: 12; 417: 13; 418: 14; 420: 25; 421: 26; 422: 12; 423: 26; 424: 15; 425: 15; 426: 15; 427: 15; 428: 15; 429: 20; 430: 21; 431: 15; 432: 20. Day 419 contributes none: the archive has no candidates file or stylelab for it (only topic notes and rendered cards), and nothing was invented to fill the gap.

Quality checks: 10 sampled records across 10 different days were matched back against their source files character for character after whitespace normalization (10 of 10). Dates derive from the Day 424 = 2026-10-15 anchor and are baked into each record; unit tests re-derive every record's date, weekday, month, and year from the anchor and compare. The generator is deterministic: repeated runs produce identical bytes (verified by checksum and by a test that reruns it).

## API contract (as built)

- `GET /api/quotes`: `{ storage, quotes: [{ id, text, day, date, weekday, month, year, context?, up, down, score }] }` in HOT order (score desc, newest first). Public; cached `s-maxage=20, stale-while-revalidate=60`.
- `GET /api/quotes?voter=0x…`: the same payload plus `voter` and `votes: { quoteId: 1 | -1 }` for that wallet's arrows; never CDN-cached.
- `POST /api/auth`: body `{ address, signature }`. The signature must be the wallet's EIP-191 signature over the canonical sign-in message (see `api/_session.js`). Verified server-side with viem; success sets the `ohnahji_quotes_session` cookie (HTTP-only, Secure, SameSite=Lax, 30 days) and returns `{ address, expiresAt, storage }`. Only the SHA-256 hash of the session token is stored server-side. Body `{ action: 'signout' }` clears it.
- `POST /api/vote`: session cookie required; the voter is always the session's wallet. Body `{ quoteId, direction }` with direction 1, -1, or 0 (retract). Reddit semantics: the opposite direction switches, 0 retracts, repeating the same direction is a no-op. Counts move only by the shared delta math in `api/_votes.js`. Returns `{ quoteId, up, down, score, yourVote }`. No session returns 401 with code `SIGN_IN_REQUIRED`; unknown quote or bad direction returns 400.
- There is no per-vote signature and no onchain write anywhere in the flow; the one signature happens at sign-in only.

## Storage mode shipped: memory (one user action needed)

The Vercel project has no KV or Upstash env vars (checked `filter_project_envs`: only the Twitch pair), and the Vercel connector offers no KV/Redis store creation (its only storage create is blob), so the build shipped with the brief's specified fallback: the store interface in `api/_store.js` with the in-memory implementation active. `GET /api/quotes` reports `"storage": "memory"` honestly. In memory mode, votes and sessions live in the serverless function instance and reset on cold starts and redeploys; they are not persistent and are not presented as such.

To make votes persistent, the owner needs to do this once in the Vercel dashboard: open the `ohnahji-timeline` project, go to the Storage tab, create a KV (Upstash Redis) store, and connect it to the project. Vercel then injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically; any redeploy after that flips the API to `"storage": "kv"` with no code change (the KV implementation is already written and speaks the Upstash REST API). Until that step, treat live vote counts as ephemeral.

## Verification

- Tests: 55 of 55 passing (`npx vitest run`), covering vote delta math (fresh, switch, retract, repeat, negative clamp), auth (a valid throwaway-key signature passes; a wrong signer fails; a signature over a tampered message fails), the full vote lifecycle through the real handlers (upvote, repeat, switch, retract, two wallets, sign-out), the quotes endpoint (archive, counts, voter map, cache headers), seed invariants, generator determinism, and deck composition (quotes in the base deck; gated pair unchanged). `tsc -b` is clean and the production build succeeds.
- Browser QA against the built app with the API intercepted by a fixture produced by driving the real handlers with six throwaway wallets (scores up to +5 and down to -2): desktop feed renders with the top card at score 5; the Thursday filter reports 43 matching quotes; WORST brings a negative quote first; the 390px feed renders and tapping a vote arrow with no wallet shows the connect prompt; zero uncaught page errors across all 11 public routes. Screenshots in `QA/quotes/` (desktop feed, Thursday filter, WORST sort, mobile feed, mobile sign-in prompt).
- Production: the served entry asset is 1,809,412 bytes, exactly the local build's size, and byte-identical after chunk-hash normalization. `/quotes` returns 200. `GET https://ohnahji-timeline.vercel.app/api/quotes` returns all 317 quotes with `"storage": "memory"`. A forged `POST /api/vote` with no session returns 401 `SIGN_IN_REQUIRED`, and a forged `POST /api/auth` with a bad signature returns 401, both checked with curl against production.

## Wave 2 (Parts 2 to 8, shipped with the deploy that follows this report update)

### Part 2: cached onchain supply endpoint

- New `api/supply.js`: a plain Node handler that reads `totalSupply()` (selector `0x18160ddd`) from the OG contract server-side via `https://ethereum-rpc.publicnode.com`, falling back to `https://eth.llamarpc.com` and then `https://cloudflare-eth.com`. It returns `{ totalSupply, revealed: totalSupply - 30, maxSupply: 9010, updatedAt }` with `Cache-Control: s-maxage=120, stale-while-revalidate=300`. If every RPC fails it returns the last verified supply (5,097, checked onchain 2026-10-23) in the same shape with `"stale": true` instead of an error.
- Client: `fetchTotalSupply` in `src/hooks/useStore.tsx` now tries `/api/supply` first and falls back to the existing direct publicnode read; `LAST_KNOWN_TOTAL_SUPPLY` (5097) remains only as the pre-load paint value, and the 5-minute staleTime is unchanged. Genesis counts and the gallery cap derive from the same value exactly as before.
- Tests (`src/__tests__/supply-api.test.ts`, 5 tests): handler success shape with the revealed math (5097 in, 5067 revealed), fallthrough from a failing RPC to the next, total-failure stale shape, client prefers `/api/supply` when it answers (a stubbed 5150 wins), and client fallback to the RPC read when the API fails. Suite total is now 60 of 60.
- Production verification: recorded in the deploy note at the end of this section.

### Part 3: in-page VOD playback on the Live slide

- Problem (user screenshot, 2026-10-23): Twitch's own offline "Watch Latest Stream" button is dead inside iframe embeds (a known Twitch limitation), and the LATEST BROADCASTS cards only linked out. The player now has three sources: channel, video, and clip.
- `api/twitch.js` is additive only: videos carry their numeric `id`; clips carry `id` and `embedUrl` (the Helix `embed_url`).
- Player behaviour (`src/features/community/Slide5Livestreams.tsx`): broadcast cards play the VOD in place (`https://player.twitch.tv/?video={id}&parent={hostname}&autoplay=false`) and scroll the player into view; clip cards load the clip's Helix `embedUrl` (a `parent` parameter is appended only when the URL lacks one). Each card keeps a small external-link icon to open it on Twitch instead. When the channel is offline and videos exist, a site-styled WATCH LATEST BROADCAST button loads the newest VOD; in video or clip mode a BACK TO LIVE CHANNEL button restores the channel player. Twitch's internal offline button is untouched.
- QA (headless, `/api/twitch` intercepted with an offline fixture of 2 videos and 1 clip whose embedUrl already carries `parent=127.0.0.1`): clicking the first broadcast card sets the iframe src to the video URL with the fixture id; BACK TO LIVE CHANNEL restores the channel src; clicking the clip card sets the iframe src exactly equal to the fixture embedUrl; WATCH LATEST BROADCAST loads the first video. Screenshot: `QA/wave2/vod-loaded.png`. The controls-row buttons are clicked via DOM dispatch in the harness because the software renderer's scroll-into-view misjudges that row after the player scrolls into centre; the state assertions themselves are strict.
- Production note: real Twitch playback cannot be clicked through from the sandbox, so the shipped bundle is grepped for the video-mode player logic as deploy evidence (recorded in the deploy note).

### Part 4: Socials label

- The X card on the Socials slide reads "Twitter" again (`src/features/community/Slide6Socials.tsx`). The destination (`https://x.com/ohnahji`), the black styling, the icon, and the card's position are unchanged.

### Part 5: chrome tint glitch on wallet connect

- Symptom (real device): the footer and chrome tint turned white while parked on ART (maroon `#3C0010`) right after connecting a wallet; scrolling fixed it. Root cause, verified in code: the tint is a framer-motion `useTransform` of `scrollProgress`, and `scrollProgress` was only ever set inside the scroll handler. Parked on Art in the 11-slide base deck, progress sits at 5/10; when the holder connect grows the deck to 13, the transform stops remap to i/12, and the stale 5/10 lands exactly on Merch's stop (6/12), which is white. No scroll event fires while parked, so nothing corrected it.
- Fix, two layers. (1) Correction layer in `useSlideScroll`: the geometry formula was extracted into `syncProgressFromGeometry`, and a new effect keyed on the deck composition re-derives progress from the scroller's real `scrollLeft` after a deck change (requestAnimationFrame plus a 300 ms retry, mirroring the deep-link retry pattern); when the scroller is parked exactly on the active slide it snaps progress to that slide's exact stop. It does nothing while a programmatic scroll is in flight, and mid-swipe blending is untouched. (2) Backstop in `App.tsx`: the theme-color effect now also sets `document.body.style.backgroundColor` to the active slide's hex on index change.
- Repro QA (stubbed wallet, parked on `/art`, no scroll performed; deck 11 to 13 for a holder, unchanged for a non-holder): before connect the shell is maroon `rgb(60, 0, 16)`; after a holder connect the deck shows 13 dots, `scrollLeft` is unchanged, and both the shell and body backgrounds are exactly maroon; a non-holder connect keeps 11 dots and the maroon tint; the disconnect direction (13 back to 11 via the wallet details modal) also settles maroon with no scroll. All covered in `QA/wave2/qa.mjs`; screenshot `QA/wave2/tint-holder-art.png`.

### Part 6: Genesis gallery search syncs with total supply

- Defects (user screenshots): the search was a number input capped at the revealed max (5,067), so typing 5097 raised the browser's native validation bubble, and the placeholder text garbled while typing.
- Fix (`src/components/NFTGallery.tsx`): the input is now `type="text"` with `inputMode="numeric"`, a digit pattern, no `max` attribute, and the form is `noValidate`, so no native bubble can appear. The placeholder reads `Search #1-{totalSupply}` with the live supply formatted via `toLocaleString`, and the accepted range is 1 to the live totalSupply (the same `/api/supply`-backed value the rest of the slide uses, per Part 2).
- Unrevealed band: ids in (supply minus 30, supply] open the token detail in its unrevealed state (`src/components/NFTDetailModal.tsx` gained an `unrevealed` flag): the mint placeholder art (NoRevealHolder on the placeholder CID, the same art the Mint slide uses), a NOT REVEALED YET badge, HIDDEN UNTIL REVEAL copy, the correct token number, and the OpenSea asset link; no metadata fetch is attempted. Ids past the supply get the styled message "That token does not exist yet; {supply} minted so far"; empty, zero, or non-numeric input gets "Enter a token number between 1 and {supply}". Revealed ids open the art detail directly. The browsable grid stays capped at the revealed range; only search reaches the band.
- QA (supply stubbed to 5097 through the `/api/supply` fixture): search 5067 opens the revealed detail with no unrevealed badge; 5097 opens the unrevealed detail with the right number; 5098 prints the does-not-exist message; the input asserts `type="text"`, `inputmode="numeric"`, and no `max` attribute. Screenshot: `QA/wave2/genesis-unrevealed-5097.png`.

### Part 7: Quotes slide goes brand pink

- `src/lib/deck.ts`: the `/quotes` entry hex is now `#FE517E` with `bg-ohnahji-pink`; the chrome tint follows automatically, and the Part 5 repro passes with the new stops.
- Design consequences handled in `SlideQuotes.tsx`: pink is out of the card cycle (cards now rotate white, gold, burgundy, black, all still legible on pink with their black borders); the vote-note pill moved from pink to white so it separates from the background; the sticky filter bar's backdrop is pink at 95 percent to match the slide; helper text on the pink background moved from burgundy at 70 percent to 90 percent for contrast; the black card counts as a dark card for its score and date colours.
- QA: the quotes panel's computed background is `rgb(254, 81, 126)` and none of the first 8 cards is pink. Screenshot: `QA/wave2/quotes-pink.png`.

### Part 8: sitewide chrome layering (content over tint, under the chrome)

- User's report: quote cards were sliced off at the footer band boundary. The shell is restructured so the layer order is: (1) the interpolated shell tint; (2) the slide viewport, now full-bleed across the whole shell height, scrolling over the tint; (3) the interactive chrome (progress strip, MINT and CONNECT pills, gold dock pill with its nameplate) floating above content. The header and footer no longer exist as layout bands; the progress strip and the dock are absolutely positioned overlays, and nothing clips content at a band edge.
- Click routing: the dock wrapper and the NavigationDots root are `pointer-events-none`; only the dock pill assembly is `pointer-events-auto`, so content beneath the transparent parts of the footer zone stays clickable and the dock never loses a tap to a card passing under it. The MINT and CONNECT row was already a fixed overlay and is unchanged.
- Clearance: slide inner scrollers carry a `slide-scroller` class (`src/index.css`): scroll-padding top 5rem (under the fixed pills) and bottom 8rem (over the dock), plus a matching 8rem bottom padding so the last row can always rest fully clear of the dock; in browser mode on phone widths the bottom clearance grows by the same 88px the dock lifts by, keeping the two in step. Slides with fixed internal layouts needed no design changes and no exceptions: Art's grid is centred inside the padded content box and its second row clears the dock at both 1440x900 and 1280x800; Live embeds, First Look iframes, and the Vault layout verified by screenshot and the route sweep.
- QA evidence (`QA/wave2/`): mid-scroll Quotes screenshots on desktop and at 390px show cards passing beneath the gold dock pill over the pink tint (`quotes-mid-scroll.png`, `quotes-mid-scroll-390.png`); a hit test at the dock's centre resolves to the dock, not the card under it; at maximum scroll, with the feed fully expanded, the last card's bottom edge clears the dock top (`quotes-rest-clear.png`); Socials mid-scroll at 390px (`socials-mid-scroll-390.png`); Art fit re-checked at both desktop sizes (`art-fit-1440.png`, `art-fit-1280.png`); zero uncaught page errors across all 11 public routes.
- Full wave QA: 43 of 43 checks in `QA/wave2/qa.mjs` pass; unit suite 60 of 60; `tsc` clean; production build succeeds.

### Wave 2 deploy note

- Deployed 2026-10-23: snapshot commit `7860300bfbefb0464e3eedce23e54a87fb8a455a` on `eBV/onjutimeline-dashboard` main; production deployment `dpl_Ema2QFm2k5tieKoVmU7mgThbf1Ls` READY (a docs-only follow-up carrying this note succeeds it with identical code).
- Entry asset: production serves `index-BexJYlWa.js` at 1,810,789 bytes, exactly the local build's entry size, and byte-identical after chunk-hash normalization. The Live and Socials lazy chunks are likewise the same sizes as local (33,378 and 13,381 bytes) and identical after normalization.
- `GET https://ohnahji-timeline.vercel.app/api/supply` returns `{"totalSupply":5097,"revealed":5067,"maxSupply":9010}` with a fresh `updatedAt` and no stale flag (live RPC read, edge cached).
- `GET /api/quotes` returns the 317-quote archive with `"storage": "memory"`; `/quotes` returns 200; a forged `POST /api/vote` returns 401 `SIGN_IN_REQUIRED`.
- Part 3 evidence in the shipped bundle: the production Live chunk contains `WATCH LATEST BROADCAST` and the `player.twitch.tv/?video=` player template; production `/api/twitch` returns videos with numeric `id` fields (the Day 432 VOD, id 2908650559, first) and clips with `embedUrl`.
- Part 4 evidence: the production Socials chunk contains `name:"Twitter",link:"https://x.com/ohnahji"`.
- Parts 5 to 8 ride the same entry bundle that was hash-verified above and QA-verified locally (43 of 43 checks); the Quotes deck entry (pink hex) is part of that entry chunk.

## Daily sync (for the cron the parent wires next)

Regenerate the seed from the repo root with exactly:

```
node scripts/sync-quotes.mjs
```

It reads `~/workspace/ohnahji-brand/one-liners/` by default (override with `ONE_LINERS_DIR`) and rewrites exactly two files: `src/lib/quotes-data.json` and `api/quotes-data.json`. The sync step is then: commit those two files, snapshot-push those same two paths to `eBV/onjutimeline-dashboard` main, let it deploy, and confirm the max `day` in production `GET /api/quotes` advanced. No other files change unless a future day introduces a new archive shape the parser does not know, in which case the generator's per-day counts are the tripwire.

## Honest limits

- Sybil cost is one wallet per vote; nothing in v1 stops someone voting from many wallets. Scores are community signal, not proof.
- The in-browser voted-arrow highlight with a real wallet is exercised at the handler level with genuine signatures (unit tests and the QA fixture) rather than with a live browser wallet; the first real holder to vote will be its first full end-to-end run in production.
- While storage is memory mode, counts shown in production can reset at any cold start; the archive itself (the quotes) is static seed data and never resets.
