# PWA INSTALL REPORT

Date: 2026-10-24
Status: BUILT AND VERIFIED ON BRANCH, NOT DEPLOYED (by design; the
nameplate-fix agent owns the deploy lane on metito/target-ui-fixes)
Branch: `metito/pwa-install`, from `metito/target-ui-fixes` at `6fe5f7c`
(wallet modal restyle). No commit was made to `metito/target-ui-fixes`
and nothing was deployed.

## The blocker (parent diagnosis confirmed, not re-guessed)

Chrome on Android refused Install because there was no real service
worker: `/sw.js` did not exist in the build output, so the site's
catch-all rewrite served the SPA index HTML for it, and Chrome's
installability check (a registered worker with a fetch handler) failed.
The manifest, icons, and iOS meta were already correct and are
unchanged except where noted below.

## What shipped

- `public/sw.js` (new): a real service worker served from the site
  root as a static file. Rules, in order: (1) API and third-party
  requests (`/api/*` and any cross-origin request: chain RPC,
  Highlight, fonts) are never intercepted for caching; they go to the
  network and fail like there was no worker, so live data is never
  served stale as if fresh. (2) Navigations are network-first with a
  fallback to the cached app shell, so the installed app opens
  offline. (3) Same-origin `/assets/*` files are Vite content-hashed
  and immutable, so they are cache-first. (4) Other same-origin files
  (icons, manifest) are network-first with a cached offline fallback.
  The shell precache is `/`, `/index.html`, `/manifest.json`. A new
  version does NOT skipWaiting: it activates on the next load, never
  mid-session. On activate it deletes old caches and claims clients.
- `src/lib/registerServiceWorker.ts` (new) + `src/main.tsx` (wired):
  registration runs in production builds only, on window load, and
  any registration failure is silent (no user-facing error, no retry
  loop). The site works identically without a worker; it is just not
  installable.
- `vercel.json` (changed): explicit self-rewrites for `/sw.js`,
  `/manifest.json`, `/icon-192.png`, `/icon-512.png`,
  `/apple-touch-icon.png`, `/favicon-16.png`, `/favicon-32.png`, and
  `/ji.png` are listed before the SPA catch-all, so those paths can
  never be rewritten to index HTML. (Static files in the build output
  would normally win over rewrites anyway; this is belt and braces,
  and it documents the intent.)
- `src/__tests__/sw.test.ts` (new): 8 tests driving the real
  `public/sw.js` in a VM sandbox with stubbed worker globals. Covered:
  all three handlers register; shell precache contents; API and
  third-party requests are never intercepted; non-GET passes through;
  navigation network-first with cached shell offline; assets
  cache-first with cache fill on miss; activate cleans old caches and
  claims clients; no `skipWaiting(` call anywhere.

## Icon and iOS verification (real pixel checks)

- `icon-192.png` is 192x192, `icon-512.png` is 512x512, both RGBA,
  manifest purpose `any maskable`, both fetch 200 as `image/png`.
- Maskable safe zone, honest finding: the artwork is a near-solid
  maroon field with a faint centered outline that reaches near the
  edges, so a circular mask clips the outline's corners. Nothing
  legible is lost (there is no text or logo mark at the edges), and
  safe-zone imperfection does NOT block Chrome installability. The
  artwork was deliberately not regenerated here: the repo's icons are
  the older copies and a redesign is a separate decision for the
  owner, not a silent side effect of this fix.
- iOS meta already complete and verified in the built page:
  `apple-touch-icon` (180x180 PNG), `apple-mobile-web-app-capable`
  yes, status bar `black-translucent`, title `OHNAHJI`,
  `viewport-fit=cover`. Apple startup images were NOT added: they
  need a full size matrix to be correct, and iOS falls back to a
  screenshot splash without them, which is acceptable.
- Manifest unchanged and valid: name, short_name, start_url `/`,
  scope `/`, display `standalone`, theme/background `#3C0010`.

## Browser QA (production build served by vite preview, Playwright)

Harness: `QA/qa-pwa.mjs`, results `QA/pwa/qa-results.json` (QA/ is
gitignored, so these are local evidence, not committed). All checks
passed, zero page errors:

- `/sw.js` returns 200 `text/javascript` and is JavaScript, not HTML.
- Manifest valid (name, short_name, start_url, scope, display,
  192 + 512 icons); both icons 200.
- Service worker registers with scope `/`, state `activated`.
- iOS meta all present (see above).
- Navigation to `/quotes` works with the worker active; hard reload
  works.
- Offline shell load works: with the browser offline, reloading `/`
  serves the cached shell and the title is correct.
- One harness note: the first QA run timed out on `networkidle`
  because the app polls live feeds continuously, so the harness uses
  `domcontentloaded` for reloads. That is a test artifact, not an app
  defect.

## Merge and deploy steps for the parent (after the nameplate fix lands)

1. On `metito/target-ui-fixes` after the nameplate deploy commit:
   `git merge metito/pwa-install`. Expected conflicts: none with the
   nameplate work (different files: the nameplate agent touches the
   dots component; this branch touches `public/sw.js`,
   `src/lib/registerServiceWorker.ts`, `src/main.tsx`, `vercel.json`,
   `src/__tests__/sw.test.ts`, and this report). If the nameplate
   agent touched `src/main.tsx` or `vercel.json`, keep both changes.
2. Re-run the full suite and `tsc -b` until green.
3. Snapshot-deploy via the standing GitHub-connector route to
   `eBV/onjutimeline-dashboard` main, wait READY.
4. Verify in production: `/sw.js` returns JavaScript (not HTML),
   `/manifest.json` is valid, `/api/site-config` and `/api/supply`
   stay healthy, and the entry bundle references `/sw.js`
   registration.
5. The owner's phone check is the final proof (see below).

## Honest limits

- Headless QA cannot click Chrome's real Install sheet, so the
  Android proof is the owner's phone check: Chrome menu on
  `ohnahji-timeline.vercel.app` should offer Install (not "This app
  cannot be installed"), and the installed app should open
  standalone with no browser chrome.
- iOS proof is likewise the owner's check: Safari Share, Add to Home
  Screen, then launch; it should open standalone with no Safari
  chrome, using the apple-touch-icon.
- If Android still refuses Install after this deploy, the remaining
  suspects in order are: (1) the deployed `/sw.js` is still HTML
  (check the content type first), (2) the device is on an old cached
  page (hard refresh or clear site data once), (3) Chrome's
  engagement heuristics on a fresh profile. The worker, manifest,
  icons, and HTTPS legs are all verified in this report.
- The installed app's first load after an update uses the previous
  worker until the next load, by design (no skipWaiting), so a
  redeploy is picked up on the second launch, not mid-session.
