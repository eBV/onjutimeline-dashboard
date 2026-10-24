# MURALITH NATIVE MINT TAB

Date: 2026-10-24
Status: BUILT AND VERIFIED ON BRANCH `metito/muralith-tab`. NOT DEPLOYED, by design.
Branch point: `metito/target-ui-fixes` HEAD `8c0f0a4` (admin panel v1 state; admin v2's
uncommitted work in the main worktree was deliberately NOT included).
Worktree: `~/workspace/onjutimeline-muralith` (same repo, separate checkout, so the
admin v2 agent's working tree was never touched).

## Verified contract facts (all checked 2026-10-24, before any mint code)

- Chain: Ethereum mainnet (1). Source: the Highlight mint page's canonical URL
  `https://highlight.xyz/mint/1:0xc73ec73b53ecf64ef88d5ebcabab9a5f666e6ecc:0`.
- Contract: `0xc73EC73b53EcF64EF88D5EBCaBaB9A5f666e6ecc`, ERC721, symbol MRLTH,
  name Muralith, owner/creator `0x64A15b1D2DE581097CB48e5D82619203E24BB3e1`
  (ohnahji.eth). Source: Highlight collection endpoint plus Etherscan, where the
  contract is source-verified as a proxy for ERC721GenerativeOnchain
  (implementation `0x54003072...DA9057178`).
- Sale (public Highlight collection endpoint): FIXED_PRICE, status Live,
  lifecycle Live, not paused, PUBLIC access, price 0.001 ETH, Highlight mint
  fee 0.0008 ETH, per-transaction / per-wallet / total caps all 0 (no caps).
  Total per mint: 0.0018 ETH before network gas.
- Supply (direct chain reads via publicnode RPC): totalSupply 2, supply 2,
  limitSupply 0 (open edition, no cap). Tokens 1 and 2 exist on Highlight.
- The mint path: the collection contract's mint functions are MINTER-GATED
  (calling them directly reverts NotMinter), so a public mint cannot call the
  contract. The mint goes through Highlight's sale claim API: free SIWE
  sign-in, then POST a claim, then submit the returned transaction.
  Registered minter (live `minters()` read): `0x1bf979282181f2b7a640d17aB5D2e25125F2de5e`.
- SIWE message (read from Highlight's own auth runtime chunk): EIP-4361 with
  domain = the signing site's host, uri = the signing site's origin, chain 1,
  version 1, statement "Sign in to Highlight.", nonce from
  POST `/user/signin/siwe/nonce` (10-minute window, issuedAt/expiresAt
  returned). Verify: POST `/user/signin` with `{ providerType: 'Siwe',
  message, signature }`, which returns `{ tokens: { accessToken }, user }`.
- CORS (preflighted for both origins): Highlight's API returns
  `Access-Control-Allow-Origin: *` plus `authorization,content-type` for
  non-highlight origins, so public reads and bearer-token claim calls work
  from the timeline site. Cookie sessions do NOT work cross-site (only
  highlight.xyz gets `Allow-Credentials: true`), which is why the tab uses
  the bearer access token, never cookies.

## What shipped (branch only)

- New public slide MURALITH (`/muralith`, pink `#FE517E`), after `/socials`
  in the base deck and before the gated pair appends, so base indexes never
  shift. Registered in `src/lib/deck.ts`, `src/App.tsx`, and
  `api/_config.js`, so the admin panel picks it up as a configurable slide
  (visible toggle, hex; gate/order/weight/copy once admin v2 merges).
- `src/features/muralith/SlideMuralith.tsx`: brand neo-brutalist slide with
  the Muralith description, artwork image (Highlight og asset, hidden on
  load failure), and a live mint panel: price, Highlight fee, minted
  (chain totalSupply, "open" when limitSupply is 0), LIVE badge, quantity
  stepper 1..10, total amount, and links (View on Highlight, contract on
  Etherscan).
- Mint flow, in order: connect wallet (site thirdweb stack, mainnet) ->
  SIGN IN TO HIGHLIGHT (one free SIWE signature; copy says it moves no
  funds and that minting is a second, separate confirmation) -> MINT NOW
  (claim) -> an exact-confirmation card (quantity, total, minter check
  note) -> CONFIRM MINT (wallet confirmation) -> submitted (Etherscan link)
  -> confirmed (Highlight reveal link). A best-effort POST of the tx hash
  to Highlight's `/tx/1/{hash}` runs after broadcast so the reveal page
  can find the mint; its failure never blocks a confirmed mint.
- Safety gate (`src/lib/muralith.ts`, `validateClaimTx`): before any wallet
  confirmation, the claim transaction must target a live registered minter
  of the Muralith contract, on chain 1, carrying exactly
  amount x (price + fee). Anything else is refused with a plain-language
  reason and no signature is requested. Wrong-chain wallets, paused or
  non-public sales, failed sale reads, and failed minter reads each disable
  minting with a stated reason; every failure shows a "mint directly on
  Highlight" fallback link.
- The Highlight bearer token lives in component memory only, never in
  localStorage or a cookie, so a page refresh asks for the free signature
  again. That is deliberate.

## Tests and QA evidence

- Unit: 109/109 pass (13 files), `tsc -b` clean. New coverage in
  `src/__tests__/muralith.test.ts`: verified facts, deck position
  (Muralith directly after Socials), Highlight collection parsing against a
  trimmed live fixture, sale-open rules, malformed-shape rejection, the
  exact SIWE message string, and the claim-validation matrix (good tx,
  wrong chain, non-minter destination, wrong value, multi-mint scaling,
  envelope parsing, empty calldata rejection). Deck counts in
  `src/__tests__/deck.test.ts` were updated for the grown deck (12 base,
  14 holder, 15 admin+holder).
- Browser QA (`QA/qa-muralith.mjs`, production build served locally,
  Highlight endpoint and mainnet RPC stubbed with fixtures, so no
  transaction could be sent): 20/20 checks, zero page errors. Live sale at
  desktop and 390px (title, 0.001 / 0.0008 / 0.0018 ETH, minted 2 / open,
  LIVE badge, CONNECT WALLET prompt, Highlight link); paused sale shows
  the not-open reason and no MINT NOW button; Highlight read failure shows
  the unavailable reason. Screenshots in `QA/muralith/` (gitignored, same
  as prior waves): `desktop-live.png`, `mobile-live.png`,
  `desktop-paused.png`, `desktop-down.png`.
- Two real layout bugs caught in screenshots and fixed: the gold button's
  hard offset shadow overlapped the footer line (added clearance), and
  the card was taller than the fold (compacted image and rows).

## Honest limits (read before real mints flow)

- The two steps no stub can exercise are the owner's first real Highlight
  SIWE sign-in from the timeline origin and the first real claim call.
  Both are inferred from Highlight's own shipped code (message builder,
  bearer token flow, claim response passed straight to the wallet send),
  and both are fenced: if Highlight's verify rejects a non-highlight.xyz
  SIWE domain, or if the claim call rejects the bearer token, the tab
  shows the failure plainly and points at minting directly on Highlight.
  No funds move on a failed sign-in or a refused claim.
- The claim amount is sent as a JSON number. If Highlight expects a
  string, the claim errors visibly and the tab reports it; it cannot
  silently mint the wrong quantity, because the value check runs after.
- First real mint should be a single 0.0018 ETH test mint by the owner,
  watching for: the SIWE signature prompt, the exact-confirmation card
  showing 0.0018 ETH, the Etherscan link, and the Highlight reveal link.
  If any step behaves differently, stop and report it before publicizing
  the tab.
- The artwork image loads from Highlight's asset CDN (an `<img>`, no JS
  dependency). If that asset ever moves, the image hides and the burgundy
  panel shows; the mint panel is unaffected.

## Merge-then-deploy steps for the parent (after admin v2 lands)

1. In `~/workspace/onjutimeline-target-ui` (main worktree), on
   `metito/target-ui-fixes` after admin v2's deploy commit:
   `git merge metito/muralith-tab` (the branch lives in the same repo;
   it was built in the `~/workspace/onjutimeline-muralith` worktree).
2. Resolve conflicts if admin v2 touched the same files (expected
   candidates: `src/lib/deck.ts`, `src/__tests__/deck.test.ts`,
   `api/_config.js`, `src/App.tsx`). Rules: keep admin v2's deck/config
   shape (order/gate/weight/copy fields) AND keep the `/muralith` entry
   (pink `#FE517E`, after `/socials`); keep both tests' count updates
   (base deck becomes admin v2's count plus one); re-run the full suite
   and `tsc -b` until green.
3. Snapshot-deploy via the standing GitHub-connector route to
   `eBV/onjutimeline-dashboard` main, wait READY.
4. Verify in production: `/muralith` renders with a live price/supply
   read, `/api/site-config` lists `/muralith`, a forged admin write is
   still rejected, and `/api/quotes` plus `/api/supply` are healthy.
5. The owner then does the single test mint described above before the
   tab is announced anywhere.

## Files

New: `src/lib/muralith.ts`, `src/features/muralith/SlideMuralith.tsx`,
`src/__tests__/muralith.test.ts`, `QA/qa-muralith.mjs` (untracked).
Changed: `src/lib/deck.ts`, `src/App.tsx`, `api/_config.js`,
`src/__tests__/deck.test.ts`.
