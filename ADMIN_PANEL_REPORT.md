# ADMIN PANEL REPORT

Date: 2026-10-23 (built and deployed the same night as the Quotes wave)
Status: DEPLOYED AND VERIFIED IN PRODUCTION
Local commit: `a4eb55c` on `metito/target-ui-fixes`
Snapshot commit: `11da3d557e185955c0ce9ae512d256cee9f68ade` on `eBV/onjutimeline-dashboard` main
Production deployment: `dpl_3iNoMmUrPaUFx8YFhSBusBTNeQDC` (READY, target production)

## What shipped

A hidden ADMIN tab at the very end of the deck, visible only while the owner's wallet is connected, with live controls for the whole site: per-slide visibility toggles, per-slide background colours, and four feature switches. Every change saves automatically through an admin-only API into the site's config store; the site consumes that config on load and reshapes itself for every visitor.

Owner identity: ohnahji.eth = `0x64A15b1D2DE581097CB48e5D82619203E24BB3e1` (ENS verified both directions by the parent agent, 2026-10-23). It is the sole admin in v1; the allowlist is a small list on the server (`api/_admin.js`) with a client mirror (`src/lib/admin.ts`) that only controls tab visibility.

## Architecture

### The tab

- `ADMIN_SLIDE` in `src/lib/deck.ts` (path `/admin`, nameplate ADMIN, black) appends after `/firstlook` when `visibleSlides` is called with `isAdmin`. It is not part of `BASE_SLIDES` or `GATED_SLIDES`, is absent from the site-config document, and can never be toggled off.
- The client check is the connected wallet's address (from the existing holder-status provider); the tab, its dot, and its route simply do not exist for anyone else, and a forced `/admin` visit while not admin lands on `/` after the same cold-load grace the gated slides get.
- One real bug was found and fixed during QA: the admin slide joins the deck the moment the address is known, before the holder balance resolves, so on a cold `/admin` load the gated pair could append ahead of it, shift its index, and let the scroll handler hijack the navigation to the slide occupying the old index (the load parked on `/vault`). The URL-sync effect now waits for holder state to settle before resolving `/admin`'s index, the same pattern as gated deep links; browser QA asserts the view settles on the ADMIN slide at desktop and 390px.

### The config store

- One versioned document under the KV key `site:config`, behind the same store interface as Quotes votes and sessions (`api/_store.js` gained `getSiteConfig`/`setSiteConfig` on both backends). KV when the env is present, in-memory otherwise, and the mode is reported honestly in every response as `storage`.
- Production state at deploy time: a KV store IS connected to the project now, so `/api/site-config` reports `"storage": "kv"` and admin edits persist across deploys, devices, and visitors. (The Quotes endpoints flipped to `"storage": "kv"` too.)
- Defaults live in code on both sides: `api/_config.js` on the server, `src/lib/siteConfig.ts` derived from `src/lib/deck.ts` on the client. A unit test asserts the two copies are identical, so they cannot drift silently.
- The site can never break on config: fetch failure, missing store, malformed stored data, and store exceptions all fall back to the defaults by defensive merge.

### Exact config shape

```json
{
  "version": 1,
  "slides": {
    "/":          { "visible": true, "hex": "#3C0010" },
    "/story":     { "visible": true, "hex": "#F1C40F" },
    "/genesis":   { "visible": true, "hex": "#FE517E" },
    "/mint":      { "visible": true, "hex": "#3C0010" },
    "/community": { "visible": true, "hex": "#FE517E" },
    "/art":       { "visible": true, "hex": "#3C0010" },
    "/merch":     { "visible": true, "hex": "#FFFFFF" },
    "/live":      { "visible": true, "hex": "#FE517E" },
    "/lens":      { "visible": true, "hex": "#3C0010" },
    "/quotes":    { "visible": true, "hex": "#FE517E" },
    "/socials":   { "visible": true, "hex": "#F1C40F" },
    "/vault":     { "visible": true, "hex": "#3C0010" },
    "/firstlook": { "visible": true, "hex": "#3C0010" }
  },
  "features": {
    "mintPill": true,
    "quotesVoting": true,
    "twitchVodRows": true,
    "antiPhishingLine": true
  }
}
```

### The API

- `GET /api/site-config` (public): returns the EFFECTIVE config (defaults merged with stored) plus `storage`. Sets `Cache-Control: s-maxage=60, stale-while-revalidate=300`; production answers show `X-Vercel-Cache: HIT`, so the edge honours it. Consequence: an edit can take up to about 60 seconds to reach a brand-new visitor; the admin's own client invalidates its query on save and reshapes immediately.
- `GET /api/admin/config`: returns the STORED document (null until the first save) for the panel. Admin authz required.
- `PUT /api/admin/config`: the body IS the config; it replaces the stored document. Validation is strict: version must be 1, slide keys must be known paths (so `/admin` itself is rejected), slide entries may only carry `visible` (boolean) and `hex` (matching `/^#[0-9A-Fa-f]{6}$/`), feature keys must be the four known switches with boolean values, and unknown keys anywhere are rejected with details. The validated body is normalized to the complete document before storing, and the hero slide `/` is forced visible so the deck can never be empty.
- Authz on both admin methods: a valid session cookie from the existing `api/auth.js` sign-in flow, plus the session address on the allowlist. No session is a 401 with code `SIGN_IN_REQUIRED`; a non-admin session is a 403 with code `NOT_ADMIN`.

### Site consumption

- The app loads `/api/site-config` on mount (react-query, 60s staleTime) via `useSiteConfig`, shared by the shell and the feature consumers.
- Deck: `visibleSlides(isHolder, { isAdmin, slideConfig })` drops hidden slides for ALL visitors (holder gating still applies on top for `/vault` and `/firstlook`), and deep links to a hidden slide land on `/`.
- Features: `mintPill=false` removes the header MINT pill (the wallet button stays); `quotesVoting=false` replaces the vote arrows on every Quotes card with the score and a VOTING PAUSED note, plus a paused banner, and blocks the vote handler client-side (the API itself is unchanged); `twitchVodRows=false` hides the LATEST BROADCASTS and TOP CLIPS rows on Live while the player embed and the WATCH LATEST BROADCAST button stay; `antiPhishingLine=false` hides the safety line under the Socials links.

### Which surfaces a colour override controls

- The chrome tint system end to end: the framer-motion interpolation stops are built from the effective hexes, so the shell background, the body backstop, and the `theme-color` meta all follow the override, mid-swipe blends included.
- The slide's own full-bleed background: each slide wrapper now also carries an inline `backgroundColor` set to the effective hex, which wins over its `shellClass` when an override differs, so the slide paints the same colour the chrome shows.
- Not repainted: design elements INSIDE slides that carry their own brand classes (cards, the Quotes filter bar, the Socials card art, the First Look iframes, the dock and progress bar colours). Those are content design, not slide backgrounds. The ADMIN slide's black is fixed; it is deliberately outside the config.

### The panel

- `src/features/admin/SlideAdmin.tsx`: one scrolling column of chunky white neo cards on the black slide; TABS (one row per configurable slide: name, path, holders badge where relevant, colour swatch input plus hex text field kept in sync, chunky switch; the ONJU row's switch is disabled with a "Home is always on" note), FEATURES (the four switches with one-line descriptions), and a footer with the storage-mode indicator and a two-step RESET TO DEFAULTS.
- Saving is automatic: toggles PUT immediately; colour edits debounce 600ms because pickers fire continuously. A Saving / Saved status sits above the cards; a failed save shows the server's error inline and reverts the control to the last accepted state.
- First use asks for the standard sign-in signature (the panel explains it is free and moves no funds); a session belonging to a different wallet gets a plain explanation instead of the controls.
- Usable at 390px and desktop; QA screenshots prove both.

## Tests and QA evidence

- Unit suite: 97 of 97 pass (12 files), `tsc -b` clean. New coverage: config merge on both implementations (defaults, overrides, malformed stored data ignored, hero forced visible), defaults drift between server and client, strict validation rejections (unknown top-level key, unknown slide path including `/admin`, bad hexes, non-boolean values, unknown slide-entry keys, unknown features), the admin authz matrix (no session 401; a real signed-in non-admin session 403; seeded admin session 200; expired admin session 401), PUT round trip into the public endpoint, hero forced visible on save, and deck filtering (two hidden slides, hidden gated slide, hex override reaching the tint-stop hexes, admin append order).
- Browser QA (`QA/qa-admin.mjs`, production build served locally, `/api/*` dispatched to the REAL handlers over a shared memory store, wallet stubbed at the owner address, session cookie seeded): 19 of 19 checks, zero uncaught page errors. Highlights: the deck grows 11 to 14 dots on connect; the panel renders 17 switches; hiding STORY and recolouring QUOTES to `#123456` in the panel round-trip through the API (a panel reload shows both edits; the admin's own deck reshapes to 13 dots immediately); a fresh non-admin context then sees 10 dots with no ADMIN dot, the QUOTES slide and body tint wearing `rgb(18, 52, 86)`, `/story` bouncing home, and `/admin` bouncing home; the panel renders and settles at 390px.
- Screenshots in `QA/admin/`: `panel-desktop.png`, `panel-390.png`, `recoloured-quotes.png`, `hidden-tab-absent.png`; machine results in `QA/admin/qa-results.json`, run log in `QA/admin-run.log`.
- QA harness note: the First Look campus WebGL iframe saturates the software renderer so completely that navigations, rAF-polled waits, and screenshots on OTHER pages of the same browser can stall; the harness closes heavy pages before reloading, polls on intervals, and gives screenshots a 60s budget that cannot fail the run. Two earlier screenshot anomalies during development were this starvation plus the settle bug above, not panel defects.

## Production verification (2026-10-23, after READY)

- `GET /api/site-config`: 200, the full default config (13 slides, four features on), `"storage": "kv"`, `X-Vercel-Cache: HIT`.
- Forged `PUT /api/admin/config` with no session: 401 `SIGN_IN_REQUIRED`. Unauthenticated `GET /api/admin/config`: 401, same code.
- Bundle: the production entry (`index-qey0HBEK.js`) references the lazy `SlideAdmin-D6JhNQ6V.js` chunk and contains the admin address, the feature keys, and the `/api/site-config` call; the admin chunk contains the panel strings and `/api/admin/config`; the quotes chunk contains the VOTING PAUSED strings. (Entry filename hashes differ between the local and Vercel build environments, as in earlier waves; equivalence was verified by content, not by filename.)
- Neighbours healthy: `/api/supply` returned `{ totalSupply: 5097, revealed: 5067, maxSupply: 9010 }`; `/api/quotes` returned the archive with `"storage": "kv"`.

## Honest limits

- Client-side tab hiding is a convenience, not the boundary. Anyone can read the shipped JS and learn that `/admin` exists and which address it checks for; what they cannot do is read or write the config, because `api/_admin.js` re-checks the session wallet server-side on every call. A forged client gains a settings screen that the API refuses to serve.
- Real-wallet end-to-end is still the owner's first sign-in: QA used a stubbed wallet at the owner address plus a seeded session for the API, and a real signature flow for the non-admin case in unit tests. The owner's first live save will exercise the one path no stub can: his wallet's actual signature against production.
- Persistence is KV-backed today; if the KV env vars ever disappear, the store falls back to memory and edits reset on cold starts, with the panel footer saying so plainly.
- Votes, quotes data, and the supply cache were not touched by this wave; the only shared file changed is `api/_store.js` (two additive methods per backend).

## Files

Server: `api/_config.js` (new), `api/_admin.js` (new), `api/site-config.js` (new), `api/admin/config.js` (new), `api/_store.js` (store methods).
Client: `src/lib/siteConfig.ts` (new), `src/lib/admin.ts` (new), `src/features/admin/SlideAdmin.tsx` (new), `src/lib/deck.ts` (admin slide, config-aware deck), `src/App.tsx` (config wiring, settle fix, mint pill switch, wrapper backgrounds), `src/features/quotes/SlideQuotes.tsx` (voting pause), `src/features/community/Slide5Livestreams.tsx` (VOD rows switch), `src/features/community/Slide6Socials.tsx` (safety line switch).
Tests: `src/__tests__/site-config.test.ts` (new), `src/__tests__/admin-api.test.ts` (new), `src/__tests__/deck.test.ts` (extended). QA: `QA/qa-admin.mjs`, evidence in `QA/admin/`.
