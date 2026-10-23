# Ohnahji Timeline

An interactive timeline SPA for the **Ohnahji NFT collection** — built with React 18, Vite, and Tailwind CSS. Scroll through the project's history, mint tokens, explore the genesis gallery, and connect with the community.

---

## What It Is

Seven full-screen slides that tell the Ohnahji story:

| Slide | Content |
|-------|---------|
| **Home** | Hero landing with animated "Ohnahji" heading |
| **Genesis** | January 2022 launch — 3×3 NFT preview, gallery entry |
| **Mint** | Live mint interface via Thirdweb |
| **HBCU** | Community pivot — HBCU education focus |
| **Art** | Full NFT collection browser |
| **Live** | Livestream embeds |
| **Socials** | Community links and social profiles |

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite 6** (build tool)
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- **Thirdweb SDK v5** (wallet connect + NFT minting)
- **TanStack React Query v5** (data fetching)
- **React Router v6** (URL-based slide routing)

---

## Gallery Features

- 60 tokens loaded at a time, centered around a random or searched token
- Search by token number (capped 16 below total supply to protect unrevealed art)
- Pan + zoom canvas on desktop, scrollable grid on mobile
- Token detail popup with dynamic background color sampled from the NFT art
- Trait explorer with direct OpenSea filter links

---

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npx vitest run        # unit tests
npx playwright test   # E2E smoke tests
```

---

## Environment

No `.env` required for local dev — the contract address and IPFS CIDs are in `src/lib/constants.ts`.

---

## License

All rights reserved — Ohnahji LLC
