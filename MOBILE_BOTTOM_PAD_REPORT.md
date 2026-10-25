# Mobile bottom-clearance wave: ready to merge (NOT deployed)

Branch: `metito/mobile-bottom-pad`, from `metito/target-ui-fixes` at `6fe5f7c`.
No deploy has been made from this branch. The parent sequences the merge
after the nameplate deploy (already landed) and the PWA merge in flight.

## What this wave covers (four user items, one branch)

1. Mobile bottom scroll clearance, sitewide (original Genesis report,
   widened to all nine slides by the user's screenshot batch).
2. Socials "Join the community" heading clipped at mobile width.
3. Quotes SHOW MORE button: gold background to brand pink `#FE517E`,
   white text.
4. Lens LOAD MORE button (pink, white text) with cursor pagination,
   plus the Quotes pink button from item 3. The user clarified BOTH:
   a pink load-more button on Lens AND on Quotes.

## The fix, and why it is shaped this way

### Finding 1: container padding-bottom is dead on this scroller

The slide scroller is a column flex container. Its declared
`padding-bottom` (216px in phone browser mode: 8rem plus the 88px lift)
does NOT create scrollable room in Chrome. Measured: growing
padding-bottom from 216px to 500px left `scrollHeight` unchanged at
1004px. That is why final content sat behind the dock despite 216px
of declared clearance. The old comment claiming padding-bottom
"guarantees the last row can always scroll fully clear of the dock"
was incorrect for this flex scroller. The existing padding values
were left untouched (they still feed scroll-padding and the
min-h-full sizing); the real clearance comes from the two mechanisms
below.

### Finding 2: the shared spacer (short slides, Genesis centering)

A real trailing flex item does create scrollable room, and it floors
`maxScroll` on short slides. Added in `src/index.css`, mobile widths
only (max-width 767px, desktop untouched):

```css
.slide-scroller::after {
  content: "";
  display: block;
  flex: none;
  height: 400px;
  height: calc(845px - 50dvh);
}
```

Arithmetic for the Genesis artwork card (center at content offset
833px at 390px wide, 853px at 430px wide; centering needs
`maxScroll = cardCenter - viewportHeight/2`): the spacer tracks that
requirement across phone heights (512px at 667px tall, 423px at 844px
tall, 379px at 932px tall). Dock geometry it clears along the way:
pill about 52px tall, plus the 88px phone browser-mode lift, plus
safe-area inset, plus centering slack. The hero slide uses its own
overflow-hidden inner and is unaffected.

### Finding 3: large-overflow slides need their own in-flow room

The spacer only floors `maxScroll`; once content already overflows
past it, the spacer is inert. Measured: Quotes `maxScroll` stayed
9250 for spacer heights 423, 800, and 1200. So each failing
large-overflow slide got mobile-only trailing room inside its own
layout (desktop reset with `md:` so desktop is unchanged):

| Slide | Final block | 390px deficit | Fix | Result above dock |
| --- | --- | --- | --- | --- |
| Quotes | SHOW MORE button | 124px below dock top | SHOW MORE wrapper `mb-56 md:mb-4` | 84px |
| Socials | anti-phishing line | 17px below dock top | wrapper `pb-56 md:pb-0` (see note) | 96px (vs its 716 dock reading) |
| Live | TOP CLIPS last card | 132px below dock top | clips section `mb-56 md:mb-0` | 92px |
| Merch | last price/SHOP row | 112px below dock top | grid `mb-48 md:mb-0` | 80px |
| Art | ELEMNTs #003 label row | 140px below dock top (at viewport bottom) | grid `mb-56 md:mb-0` | 84px |
| Muralith | sale/contract/no-cap footer | 118px below dock top | footer `mb-48 md:mb-0` | 74px |

Socials needed padding, not margin, and needed more of it. The
anti-phishing line's own bottom margin collapsed out of its block
wrapper (wrapper height unmoved, scrollHeight stuck at 1267), and
96px of wrapper padding only reached a 1252px content extent, still
under the scroller's 1267px flex floor (628 root box plus 423 spacer
plus 216 padding). 224px of padding puts the extent at 1380px, lifts
maxScroll to 536, and clears the line. The three dead ends (p margin,
wrapper margin, spacer div inside the root) were each measured before
settling on wrapper padding; see the QA scripts in `QA/` (gitignored).

### Socials heading: diagnosis and fix

"community" measures 256px at 48px Inter Black, but the card's line
box is only 250px at 390px wide (220px at 360px). The heading wraps
to two lines correctly (whiteSpace is normal); the longest word
itself overflows the line box and the card's `overflow-hidden`
clips its edges. Fix: the h2 is now `text-[40px] md:text-5xl`
(40px mobile, 48px desktop unchanged). At 40px, "community"
measures 213px: fits 390px (250px box) and 360px (220px box).

### Quotes SHOW MORE: color only

`bg-ohnahji-gold text-ohnahji-black` became
`bg-ohnahji-pink text-ohnahji-white`. Border, shadow, size, and
every other class are unchanged. Computed style verified in QA:
`rgb(254, 81, 126)` background, `rgb(255, 255, 255)` text.

### Lens LOAD MORE: cursor pagination

Before, the slide showed only the first 10 posts with no way to
reach older ones. The Lens v3 posts endpoint paginates with an
opaque cursor, verified against the live API before shipping:
page 1 returns 10 posts plus `pageInfo.next`, and passing that
cursor returns the next 10 older posts (Oct 24 page 1, Oct 23 to
Oct 22 page 2). New module `src/features/lens/lensFeed.ts`
(`buildPostsQuery`, `fetchLensPage`, `mergeLensPage`); `SlideLens`
keeps its card rendering and order exactly (newest first, older
pages appended below, ids deduped, never re-sorted across pages).
Button treatment matches the MINT pill: pink background, white
text, black border, neo shadow. States:

- Idle: LOAD MORE. Loading: LOADING... (disabled). Failure: the
  existing posts stay untouched, a short note appears, the button
  becomes RETRY. End of feed: the button hides and a
  "You are caught up" note shows (also when page 1 already has no
  next cursor). If page 1 itself refetches with new content, the
  appended pages reset rather than appending stale posts under a
  fresh feed.

## Measured QA (production build served locally, headless Chromium)

Viewport 390x844 unless noted. Every slide scrolled to max; the
final block must sit fully above the dock pill top. Dock top
measured per slide (704, except Socials 716; the pill top varies
slightly by slide, so each assertion uses its own slide's reading).
The deck stacks all slide scrollers at viewport top 0, so every
measurement is scoped to the scroller containing the slide's marker
text; global document queries count hidden slides and were the
cause of the first harness run's false numbers.

| Slide | Final block bottom vs dock | Verdict |
| --- | --- | --- |
| Genesis | card center offset -12 (within 30); minted line 191 above dock; card bottom 139 above dock | PASS |
| Genesis at 430x932 | card center offset +8; minted line 195 above dock | PASS |
| Socials | heading right edge 70 inside viewport; anti-phishing line 96 above dock | PASS |
| Socials heading at 360 | 40px font, heading right edge 70 inside viewport, "community" 213px | PASS |
| Quotes | SHOW MORE pink/white, 84 above dock; last article 164 above dock; 30 articles first page | PASS |
| Lens | last card 365 above dock (3 fixture posts) | PASS |
| Lens LOAD MORE | 3 to 5 posts, order preserved, "You are caught up" shown, button hidden, appended end 105 above dock | PASS |
| Lens LOAD MORE failure | 3 posts intact, RETRY visible | PASS |
| Live | 2 fixture clips, last clip 92 above dock | PASS |
| Merch | last SHOP row 80 above dock | PASS |
| Art | ELEMNTs #003 label row 84 above dock | PASS |
| Mint | TOTAL AMOUNT 354 above dock; CONNECT WALLET 214 above dock | PASS |
| Muralith | footer line 74 above dock | PASS |
| Desktop 1440 | scroller `::after` content none (spacer inactive); Genesis layout unchanged | PASS |

Zero real JS page errors across all runs. The console shows many
`ERR_TUNNEL_CONNECTION_FAILED` resource failures: the sandbox
headless browser cannot reach CDNs and third parties (fonts,
IPFS gateways, fixture thumbnails). That is sandbox network noise,
not app defects; it does not affect layout measurements. Live and
Lens QA used scripted fixtures (Twitch feed with 2 clips; Lens
GraphQL two-page fixture) because the preview server has no
`/api/twitch` and the headless browser cannot reach the live Lens
API; the Lens pagination schema itself was verified against the
live API from the shell (see above).

Screenshots (local evidence, `QA/` is gitignored so these do not
ship in the commit): `QA/mobile-pad/genesis-end-390.png`,
`socials-end-390.png`, `socials-heading-after-390.png`,
`socials-heading-after-360.png`, `quotes-end-390.png`,
`lens-end-390.png`, `lens-load-more-390.png`,
`lens-load-more-failure-390.png`, `live-end-390.png`,
`merch-end-390.png`, `art-end-390.png`, `mint-end-390.png`,
`muralith-end-390.png`.

## Tests

- Full suite: 132/133 pass. The single failure is
  `quotes-seed.test.ts` ("max day is 432"), caused by the
  quotes-sync cron's Day 433 data landing in the shared checkout
  (`src/lib/quotes-data.json`, `api/quotes-data.json`); this wave
  touches no seed data and does not commit those files. The cron
  lane owns updating that pin. One earlier full run showed a
  second transient failure that did not reproduce in two reruns.
- This wave's tests: 10/10 pass (`lensFeed.test.ts` 7,
  `mobile-bottom-pad.test.ts` 3, including the six trailing-room
  values and the spacer values).
- `tsc -b` clean.

## Files changed (this branch only)

- `src/index.css`: mobile-only `.slide-scroller::after` spacer.
- `src/features/quotes/SlideQuotes.tsx`: SHOW MORE pink/white;
  SHOW MORE wrapper `mb-56 md:mb-4`.
- `src/features/community/Slide6Socials.tsx`: h2
  `text-[40px] md:text-5xl`; wrapper `pb-56 md:pb-0`.
- `src/features/community/Slide5Livestreams.tsx`: clips section
  `mb-56 md:mb-0`.
- `src/features/merch/SlideMerch.tsx`: grid `mb-48 md:mb-0`.
- `src/features/gallery/Slide4Collections.tsx`: grid
  `mb-56 md:mb-0`.
- `src/features/muralith/SlideMuralith.tsx`: footer
  `mb-48 md:mb-0`.
- `src/features/lens/SlideLens.tsx` plus new
  `src/features/lens/lensFeed.ts`: LOAD MORE pagination.
- `src/__tests__/lensFeed.test.ts` (new),
  `src/__tests__/mobile-bottom-pad.test.ts` (new),
  `MOBILE_BOTTOM_PAD_REPORT.md` (this file).

Deliberately NOT committed: `api/quotes-data.json` and
`src/lib/quotes-data.json` (quotes-sync cron's Day 433 update),
`NAMEPLATE_REPORT.md`, `WALLET_MODAL_REPORT.md` (other agents'
files, still untracked in the checkout).

## Merge and deploy steps (for the parent)

1. On `metito/target-ui-fixes` at its current HEAD (this branch was
   cut from `6fe5f7c`; the PWA merge may have advanced it since):
   `git merge metito/mobile-bottom-pad`. Expected conflicts: none
   with the nameplate or PWA work (different files; this branch
   touches no file either of those touched). If a conflict appears
   in `src/index.css`, keep both the spacer rule and the other
   side's changes; the spacer lives in its own `@media
   (max-width: 767px)` block after the `.slide-scroller`
   browser-mode block.
2. Re-run the full suite and `tsc -b`. Expect 132/133 with only
   the quotes-seed max-day pin failing (cron lane's item, see
   above); if anything else fails, stop and report.
3. Snapshot-deploy via the standing GitHub-connector route to
   `eBV/onjutimeline-dashboard` main (text files only; the new
   files go first so no intermediate deploy breaks on a missing
   import: `src/features/lens/lensFeed.ts` plus the report, then
   the modified files), wait for READY.
4. Verify in production: `/api/site-config` healthy (14 slides),
   `/api/supply` 5097/5067/9010, `/api/quotes` healthy; entry
   bundle references the new socials/lens chunks.
5. Owner phone checks (final proof): Genesis artwork centered at
   max scroll; all nine slides' final blocks above the dock;
   Socials heading complete; Quotes SHOW MORE pink with white
   text; Lens LOAD MORE appends older posts and ends with
   "You are caught up". The first real Lens LOAD MORE on
   production uses the live API (schema verified from the shell,
   but the in-app paged fetch has only run against fixtures).
