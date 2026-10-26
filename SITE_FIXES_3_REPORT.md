# Site fixes wave 3 (2026-10-25)

Four user items, one branch (`metito/site-fixes-3`), deployed via the
standing snapshot route.

## 1. Genesis gallery slow load and shuffle-to-pink (diagnosed first)

Root causes, all in the image path:

- **Burst 429 storm.** The gallery renders 60 tiles at once and every
  `ResilientImage` fired its full gateway chain immediately. Browsers cap
  connections per host at 6, and the burst tripped pinata's rate limit,
  so whole chains failed their way to the pink placeholder. Live probe:
  pinata answers 200 but takes ~7.4s per image through this path, so an
  unthrottled 60-tile grid was always going to crawl and fail together.
- **Shuffle never re-probed overlapping tiles.** Tiles are keyed by token
  id, so a shuffled window overlapping the old one reused components
  whose exhausted pink placeholders never re-ran their probe chain.
  That is the "shuffle goes pink and never loads" failure, not bad ids:
  shuffle already stayed inside the revealed 1..5067 range.
- **No timeout, no retry.** Image probes had no timeout, so a hung
  gateway parked a tile, and exhaustion was terminal pink.

Fixes:

- `src/lib/imageProbe.ts` (new): a shared probe pool capped at 6
  concurrent loads, with a 20s per-attempt timeout. Tiles now fill
  progressively instead of failing together.
- `src/components/ResilientImage.tsx`: rewritten around the pool;
  after the first exhausted chain it shows the placeholder but keeps
  retrying in the background (2 extra rounds, 10s apart) and swaps to
  real art when a round succeeds. Placeholder is never terminal.
- `src/components/NFTGallery.tsx`: every shuffle bumps a round counter
  used as the grid key, so all tiles remount and re-probe on shuffle.

QA (production build, pinata stubbed to a real PNG): initial load 60/60
real art; three consecutive shuffles 60/60 real art, zero stuck pink;
all-gateways-down falls back to placeholders, then the retry round
rescues all 60 tiles to real art once pinata returns.

## 2. Lens post type matches quote cards

`SlideLens.tsx`: post body was `font-bold` at base size with relaxed
leading. It is now `font-black text-lg md:text-xl leading-snug`, the
exact quote-card light treatment. QA measured both at 18px/900/24.75px
line height at 390px. Metadata (handles, timestamps) untouched.

## 3. Socials link names bigger

`Slide6Socials.tsx`: link name span was `font-bold text-sm`; it is now
`font-black text-lg`. QA at 390px: all 11 names (the shared span covers
Threads too) render 18px/900 with right edges inside the viewport; the
card layout is unchanged.

## 4. Wallet connect sheet: black, thick white border, pink lettering

`src/lib/walletTheme.ts`: sheet black `#000000`, border white
`#FFFFFF`, primary and accent text pink `#FE517E`, secondary text
lighter pink `#FF8FAB`, buttons black with pink text and white borders.
Honest limit, verified against the installed thirdweb 5.119.0 sources:
the public theme API exposes colors and fontFamily only; there is no
border-width token (thirdweb hardcodes the sheet border at 1px). The
6px border therefore comes from a scoped rule in `src/index.css` on
thirdweb's own stable `tw-modal tw-modal__connect-wallet` classes, not
on hashed internals. If thirdweb ever renames the class, the rule stops
applying and the border falls back to the theme's 1px white; nothing
breaks. QA at 390px and desktop: sheet bg black, border 6px white,
lettering pink, all options readable and tappable; screenshots in
`QA/wave3/` (gitignored).

Side observation (not changed): thirdweb v5's connect trigger carries no
`tw-connect-button` class, so the site's `[class*="tw-connect-button"]`
CSS rules in `index.css` are currently dead rules; the header pill is
styled by the Tailwind className passed through `connectButton`.

## Tests

`tsc -b` clean. Full suite 153/154; the single failure is the known
quotes-seed Day 433/434 pin (`quotes-generator.test.ts`, cron lane's
item). The suite run mutates the seed files; they were restored before
committing and no quotes-data changes ship in this wave. New tests:
`imageProbe.test.ts` (3), `walletTheme.test.ts` (1).
