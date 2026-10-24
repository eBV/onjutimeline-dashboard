# ADMIN PANEL V2 REPORT

Date: 2026-10-24 (built, QA-verified, deployed, and production-verified the same day)
Status: DEPLOYED AND VERIFIED IN PRODUCTION
Local commit: `fee4358` on `metito/target-ui-fixes`
Snapshot commits: `dea471cc` (batch 1/4), `c71c3328` (batch 2/4), `90a188d7` (batch 3/4), `bb968b04` (batch 4/4) on `eBV/onjutimeline-dashboard` main
Production deployment: `dpl_4db7yXLNQouXkz5x14jKL3SK89B3` (READY, target production)

## What shipped

Four additions to the hidden ADMIN tab, all persisted in the same `site:config` document, plus one Quotes typography fix. Everything v1 guaranteed still holds: defaults fallback, hero forced visible, the server-side allowlist in `api/_admin.js` as the real enforcement, and forged-write rejection.

1. **Tab reorder.** The config gains an `order` array of slide paths (defaults = the deck order). The panel renders its rows in the stored order and each row gets chunky up/down buttons that work at 390px (drag was not added; the buttons are the control). Hero `/` stays pinned first and `/admin` stays pinned last: the first movable row cannot move above the hero, and nothing may move into the hero's slot. Dots, nameplate, tint stops, and deep links all follow the stored order, because they all derive from the visible deck.
2. **Per-tab gates.** Each slide row gets a gate selector: Everyone (public), Connected wallet (any wallet connected, no ownership check), or OG holders (the same `balanceOf` check the old gated pair used). This generalizes the old gating: `/vault` and `/firstlook` now simply ship with gate `og` in the config, and any slide can be gated. A gated slide is absent from the deck and dots for visitors who do not satisfy the gate, with the same cold-load grace as before (no bounce while the wallet session is restoring or the balance is reading); a deep link to a gated slide lands on `/` for an unsatisfied visitor. The hero's gate is forced public (like its visibility), and the ADMIN row has no gate selector at all: it stays admin-only regardless.
3. **Font weight.** The config gains a sitewide `fontWeight` (default null = as designed) and a per-slide `weight` (default null = inherit sitewide). The panel offers a Type section for the sitewide weight and a per-slide select (Inherit sitewide plus Light 300, Regular 400, Medium 500, Semibold 600, Bold 700, Extra-bold 800). Weights apply through a `--slide-weight` CSS variable set on the slide wrapper by the shell, read by a `.slide-copy` rule that is only added to a slide's registered heading and paragraph elements when an override exists. What it controls: slide header copy (headings and intro paragraphs). What it does not: dock, pills, chrome labels, cards, buttons, and every other element inside slides, which keep their designed weights. Weights never change sizes or spacing.
4. **Editable copy.** The config gains per-slide `copy: { heading, paragraph }`. Every slide's header now renders through `useSlideSettings`, which returns the stored copy with code defaults as fallback. The panel adds a heading and a paragraph field per slide row (textareas, 300 character cap with a live count, same debounced autosave as colours). Copy renders as plain text, never as HTML, so an edited string cannot inject markup; edited copy flows and is never truncated.
5. **Quotes typography fix (separate from config).** On the Quotes slide, a quote card whose paragraph text is white (the burgundy and black cards) now renders that paragraph at `font-extrabold` (800) instead of `font-black` (900): exactly one step down the weight scale. The card component already derives `isDark` from its colour scheme, so the rule comes from the scheme, not from reading computed styles. White and gold cards are unchanged at 900.

## Config shape, version 2

Version 1 documents migrate by merge: every new field falls back to its default, so the stored v1 document keeps working and the next panel save writes version 2. Production at deploy time still held the v1 document, and `/api/site-config` already answers the full version 2 shape from it (see verification below).

```json
{
  "version": 2,
  "order": ["/", "/story", "/genesis", "/mint", "/community", "/art", "/merch", "/live", "/lens", "/quotes", "/socials", "/vault", "/firstlook"],
  "fontWeight": null,
  "slides": {
    "/story": {
      "visible": true, "hex": "#F1C40F", "gate": "public", "weight": null,
      "copy": { "heading": "How We\nGot Here", "paragraph": "Ohnahji PFPs #2513 and #2514 exhibited in MoDDA's Proof of Culture (2022 room, THE DIVERGENCE), curated by Sian A. Morson." }
    }
  },
  "features": { "mintPill": true, "quotesVoting": true, "twitchVodRows": true, "antiPhishingLine": true }
}
```

Validation is strict, as in v1: `order` must be an exact permutation of the known paths with `/` first; `gate` must be one of the three values; weights must be null or one of the six steps; copy fields must be strings of at most 300 characters; unknown keys anywhere are rejected. Merge forces the hero visible and public even from a hostile stored document.

## Copy registry: slide, heading element, paragraph element

| Slide | Heading element | Paragraph element |
| --- | --- | --- |
| ONJU (`/`) | The three-layer "Ohnahji" wordmark (all three layers) | The "Your Homebase For Learning / Emerging Technologies" tagline |
| STORY (`/story`) | "How We Got Here" h1 | The MoDDA Proof of Culture band body. The Story slide has no intro paragraph of its own, so its paragraph field controls this closest subline under the header, the first body paragraph on the slide |
| GENESIS (`/genesis`) | "The Genesis" h1 | "MLK Weekend Launch..." intro line |
| MINT (`/mint`) | "Spring '26 drop" h1 | "Limited edition mint. Join the revolution." |
| HBCU (`/community`) | "The HBCU pivot" h1 | "Education meets innovation..." intro line |
| ART (`/art`) | "OKOLOTOS & ELEMNTS" h1 | "Code-based artistic expression" subline |
| MERCH (`/merch`) | "Campus Shop" h1 | "Rep the first Web3 HBCU..." intro line |
| LIVE (`/live`) | "Livestream era" h1 | "Watch live on Twitch and YouTube" |
| LENS (`/lens`) | "@ohnahji.lens" h1 | "The latest from Ohnahji on Lens, straight from the chain." |
| QUOTES (`/quotes`) | "The Quotes Board" h1 | "Every pick from the daily stream..." intro line. Note: the per-quote card paragraphs are NOT copy fields; they are stream data, and their weight rule is the separate fix above |
| SOCIALS (`/socials`) | "Join the community" h2 | "Follow us across the web..." intro line |
| VAULT (`/vault`) | "The Vault" h1 | "A Grove-powered locker for OG Ohnahji holders..." intro line |
| FIRST LOOK (`/firstlook`) | "First Look" h1 | "Two worlds in the workshop..." intro line |

Multi-line defaults (`\n` in a heading or paragraph) render with line breaks, so an edited heading can keep the two-line look.

## Gate semantics

- `public`: everyone, including disconnected visitors.
- `wallet`: any connected wallet, holder or not. No chain read beyond the connection itself.
- `og`: a wallet with `balanceOf` greater than zero on the OG contract, the existing holder check.
- A gated slide is invisible to everyone who does not satisfy the gate: no dot, no nameplate entry, no tint stop, and its deep link lands on `/` (after the grace window, so a real holder mid-restore is never bounced).
- Gating never hides the ADMIN tab (admin-only by address) and never hides the hero (forced public).
- Opening a gated slide to the public is a supported owner choice: setting `/vault` to Everyone makes the Vault slide render for all visitors, where its own internal states (connect prompt, pass check) still apply.

## Tests and QA evidence

- Unit suite: 111 of 111 pass (12 files), `tsc -b` clean. New coverage: order permutation validation (missing path, duplicate, hero not first), the gate resolution matrix (public/wallet/og against disconnected, connected, holder), deck ordering with admin last, weight inheritance (per-slide beats sitewide beats as-designed), v1-to-v2 migration by merge, copy fallback plus validation rejections (overlong, bad key), hero forced public, and the server/client defaults drift test extended to the full v2 shape.
- Browser QA (`QA/qa-admin-v2.mjs`, production build served locally, `/api/*` dispatched to the REAL handlers over a shared memory store, stubbed wallets): 25 of 25 checks, zero uncaught page errors. Highlights: moving QUOTES up twice in the panel round-trips through the API and the admin's own dots follow (QUOTES at index 7); gating ART to OG removes it for a disconnected visitor and a connected non-holder (10 dots, `/art` bounces home) while a non-owner holder keeps it (13 dots, `/art` settles with scroll position exactly on its index); sitewide 300 plus a QUOTES override of 800 compute as 300 on the STORY heading and 800 on the QUOTES heading; editing the STORY heading and paragraph renders on the slide, including the MoDDA band body; white/gold card paragraphs compute 900 and burgundy/black card paragraphs compute 800; a forged PUT is 401; the panel renders at 390px.
- Screenshots in `QA/admin-v2/`: `panel-desktop-v2.png`, `panel-390-v2.png`; machine results in `QA/admin-v2/qa-results.json`. The quotes card-weight screenshot did not land (the harness screenshot budget expired under renderer load, a known non-fatal harness behaviour); the card-weight evidence is the computed values above, which are the precise assertion.
- QA harness notes: two real harness lessons from this run. First, the deck mounts every slide, so a bare `querySelector('h1')` returns the hero's heading, not the current slide's; weight checks scope by heading text. Second, a cold deep link can transiently overshoot one slide (scroll position one slide past the target while layout settles) before the scroll retries correct it; one full-run sample caught the overshoot landing on the neighbouring slide after the programmatic lock expired, and the check now polls for the settled state instead of sampling once. The settled behaviour is proven by a 12-second trace holding `/art` at exactly its index. The overshoot-then-hijack race lives in the pre-existing scroll-sync hook, not in the gate logic, and is left as a known flake, not papered over.

## Production verification (2026-10-24, after READY)

- `GET /api/site-config`: 200, the full version 2 config (13 paths, hero first, `/vault` and `/firstlook` gated `og`, STORY copy defaults, all features on), `"storage": "kv"`. The stored document is still v1; the v2 shape arrives by merge, which is the migration working as designed.
- Forged `PUT /api/admin/config` with no session: 401 `SIGN_IN_REQUIRED`.
- Bundle: the production entry (`index-BBUJKFRQ.js`) references the lazy `SlideAdmin-B19wm12J.js` chunk, which contains the v2 panel strings ("Who can see it", "Inherit sitewide", "Sitewide weight", move controls); the entry contains the lowercase admin address; the quotes chunk (`SlideQuotes-CdNRjTCU.js`) contains `font-extrabold` and the VOTING PAUSED strings.
- Neighbours healthy: `/api/supply` returned `{ totalSupply: 5097, revealed: 5067, maxSupply: 9010 }`; `/api/quotes` returned the archive (317 quotes) with `"storage": "kv"`.

## Honest limits

- Client-side tab hiding and gating are convenience, not the boundary: anyone can read the shipped JS and learn the slide list, but only the owner's signed-in session can read or write the config, because `api/_admin.js` re-checks the session wallet server-side on every call. Gated slide CONTENT is not secret: the slide code ships to every visitor, so gating controls discovery and navigation, not access to the underlying data (the Vault's own upload flow still enforces holder-only server-side where it matters).
- Real-wallet end-to-end is still the owner's first sign-in: QA used stubbed wallets at the owner, holder, and non-holder addresses plus a seeded session for the API. The owner's first live save of an order, gate, weight, or copy edit will exercise the one path no stub can: his wallet's actual signature against production.
- The quotes card-weight screenshot did not land (see QA notes); the computed-value evidence stands in its place.
- The transient deep-link overshoot described in the QA notes can, under renderer load, hijack a cold deep link to the neighbouring slide; the settled state is correct and the trace proves it, but a future hardening pass on the scroll-sync lock is the right follow-up if it ever shows up for a real visitor.

## Files

Server: `api/_config.js` (v2 shape, validation, merge). Client: `src/lib/siteConfig.ts` (v2 shape, merge, `useSlideSettings`, `copyLines`), `src/lib/deck.ts` (`gateSatisfied`, order, weight in meta), `src/App.tsx` (gate status, `--slide-weight` wrapper variable, generalized deep-link bounce), `src/index.css` (`.slide-copy` rule), `src/features/admin/SlideAdmin.tsx` (order buttons, gate selects, weight selects, copy fields, Type section), all 13 slide components (header copy + weight class), `src/features/quotes/SlideQuotes.tsx` (card weight fix). Tests: `src/__tests__/site-config.test.ts`, `src/__tests__/deck.test.ts` (rewritten for the gate-status signature). QA: `QA/qa-admin-v2.mjs`, evidence in `QA/admin-v2/` (gitignored, local only).
