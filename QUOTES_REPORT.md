# QUOTES Tab; Build and Deploy Report

Built and deployed 2026-10-23 from branch `metito/target-ui-fixes` (local commit `7141dc0`), per the approved brief in `~/workspace/your_files/quotes-tab-brief.md`.

Deployed: snapshot commit `c968a199580512839f00a2abedae6e4715cf1c45` on `eBV/onjutimeline-dashboard` main.
Production deployment: `dpl_3QpgeUry9BHsxFF4Gx8yn2emUzyZ` (READY, production aliases on `ohnahji-timeline.vercel.app`).

## What shipped

- New public slide `/quotes` (nameplate QUOTES) in the base deck, after `/lens` and before `/socials`. Base deck is now 11 slides; the holder deck is 13. All index-driven systems (dots, chrome tint stops, deep links) derive from `src/lib/deck.ts` as before.
- Design: white slide (hex `#FFFFFF`) so the cards carry the colour. Cards rotate white, gold, pink, burgundy in the site neo-brutalist language (6px black borders, neo shadow, Clarity City black type), with an oversized quote mark, a DAY NNN tag, the stream date, and the source context line when the archive records one. Vote rail on the left of each card: up chevron, score, down chevron; the voter's own choice fills black with a gold (up) or pink (down) chevron.
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
