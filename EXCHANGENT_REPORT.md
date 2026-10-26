# Exchangent slide (OG-gated) — wave report

## What shipped

New timeline slide `/exchangent` (name EXCHANGENT, burgundy chrome), placed
in the base deck after `/muralith` and before the gated pair, carrying
`gated: true` so its default gate resolves to `og`, the same proven
OG-holder check Vault and First Look use. The slide renders the
timeline-styled explainer variant in a same-origin iframe that fills the
slide, with an OPEN FULL SCREEN link. Heading and paragraph come from
the admin copy registry, so the admin panel drives them.

## Vendored fileset (public/exchangent/)

Copied from `~/workspace/vercel-deploy/exchangent-explainer-timeline/`,
the live explainer untouched. All root-absolute refs rewritten to
`/exchangent/...`; the live-project URLs in agents.html and llms.txt
rewritten to the timeline's own vendored paths; Google Fonts stripped
from agents.html. Verified: no `the-exchangent.vercel.app`, no
`fonts.googleapis.com`, no root-absolute asset refs, no `https://` in
the vendored scripts. Files: index.html, styles.css, timeline.css,
app.js, extra.js, tohseno.js, agents.html, llms.txt,
vendor/OrbitControls.js, and three.js as 9 string-append chunks
plus a 124-byte exec script under vendor/three-chunks/.

## three.js chunking (deploy-route constraint)

The snapshot push route passes file contents as a single CLI argument,
and the sandbox caps one argument near 128KB, so the 603KB
three.min.js cannot ride it whole (a whole-batch push failed with
E2BIG). It ships instead as 9 byte slices of the identical source:
each chunk file is `window.__t3=(window.__t3||'')+<JSON string>;`
(75,000 source bytes each, largest chunk file 79,072 bytes), and
three.exec.js injects the concatenated source as a synchronous script
in document order, before OrbitControls, preserving exact execution
order and parse-time timing (app.js has no DOMContentLoaded listener).
Round-trip verified byte-exact (SHA-256 prefix 9274bbcec8d96168 for
both original and joined chunks). The original three.min.js remains
in the variant directory it was vendored from; chunks regenerate
from it by slicing at 75,000 bytes and JSON-stringifying each slice.
Each push call carries at most one chunk, keeping every call's JSON
under the argument cap.

## Config subtlety (the KV case)

The live KV config lists 14 slides. Adding a 15th makes the stored
order invalid, so both merges fall back to the 15-slide default order
with the new slide in its base position, and the new slide keeps its
defaults (visible, gate og) because the stored slides do not mention
it. This was verified by unit test (legacy 14-slide doc through both
merges) and by browser QA (legacy KV doc intercepted). The admin
panel shows the slide once the served config falls back, and the next
panel save stores all 15 slides. Both config copies were updated in
lockstep (client `src/lib/siteConfig.ts`, server `api/_config.js`:
KNOWN_SLIDE_PATHS, DEFAULT_GATES, DEFAULT_COPY); the drift test pins
them equal.

## Gate behavior (browser QA, 11/11)

- Unconnected, legacy KV config: `/exchangent` deep link bounces to
  home, no iframe.
- Holder (injected EIP-1193 provider with EIP-6963 announce, stubbed
  balanceOf RPC returning 1) + legacy KV config: slide appears, iframe
  loads titled "Exchangent Explainer, timeline edition", island canvas
  renders with HUD theme ohnahji (select agrees), no horizontal
  overflow at 390px, zero external requests from the iframe.
- Desktop holder view: same iframe load.

## Honest limit

Gating hides navigation, not the vendored files: a visitor who guesses
`/exchangent/index.html` can fetch the static files directly. This is
the same known limit as Vault and First Look, accepted by design.

## Verification

- `tsc -b` clean. Full suite 163/164; the single failure is the known
  quotes-seed Day 433/434 pin (another lane's item, untouched here).
- New tests: `src/__tests__/exchangent.test.ts` (10 tests: gate matrix,
  legacy-KV merge, vendored fileset, vercel rewrite).
- vercel.json gains a self-rewrite for `/exchangent/(.*)` before the
  SPA catch-all, following the PWA precedent.
