# OHNAHJI | Web3's First HBCU

An interactive visual timeline SPA for the **Ohnahji** NFT community — built with React 18, Vite, and Tailwind CSS. Swipe through the full history of the project, mint tokens, explore the genesis gallery, watch recorded sessions, and connect with the community.

Live: **[ohnahji-timeline.vercel.app](https://ohnahji-timeline.vercel.app)**

---

## What It Is

Ohnahji started as a cultural art PFP collection rooted in Black and Brown culture. It grew into a safe space for Black, Brown, and Allied people to learn and build in emerging technologies — and the community named it **Web3's First HBCU**.

This timeline tells that story across nine full-screen slides:

| # | Slide | Content |
|---|-------|---------|
| 0 | **ONJU** | Hero landing with animated "Ohnahji" heading |
| 1 | **Story** | Origin story — how Ohnahji became Web3's First HBCU |
| 2 | **Genesis** | January 2022 MLK Weekend launch — NFT preview gallery |
| 3 | **Mint** | Live mint interface (Spring '26 drop) |
| 4 | **HBCU** | Community pivot — Discord Campus & #ONJUSaturdays |
| 5 | **Art** | Okolotos & Elemnts generative art collections |
| 6 | **Live** | Twitch + YouTube livestream embeds |
| 7 | **Watch** | Recorded VOD sessions via YouTube playlist |
| 8 | **Socials** | Discord, Twitter/X, Instagram, YouTube, Twitch, Farcaster, OpenSea, Etherscan |

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite 6** (build tool)
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- **Thirdweb SDK v5** (wallet connect + NFT minting)
- **TanStack React Query v5** (data fetching + on-chain reads)
- **React Router v6** (URL-based slide routing)
- **react-zoom-pan-pinch** (desktop gallery pan/zoom)

---

## Features

### Navigation
- Horizontal snap-scroll between slides with URL routing (`/`, `/story`, `/genesis`, etc.)
- Gold progress bar tracks position across all slides
- Navigation dot bar always anchored at the bottom — never overlaps content
- Persistent **Connect Wallet** button (top-right) on every slide

### Genesis Gallery
- 60 tokens loaded at a time, centered around a random or searched token
- Search by token number (capped 30 below on-chain `totalSupply` to protect unrevealed art)
- Pan + zoom canvas on desktop, scrollable grid on mobile
- Token detail popup with trait explorer and direct OpenSea filter links
- On-chain `totalSupply` fetched live from the contract at `0xbef648e3034e80efe152f3581117c1536fff5afc`

### Mint
- Live quantity selector (1–10) with real-time USD price via CoinGecko
- Thirdweb `ConnectButton` for wallet connection
- ETH transaction triggered directly from the mint button when connected

### PWA
- Installable as a home screen app on iOS and Android
- `manifest.json` with name, icons, and `display: standalone`
- Dynamic `theme-color` and `body` background sync to the current slide color
- App icons generated from the Ji logo at 180×180, 192×192, and 512×512

---

## Project Structure

```
src/
├── features/
│   ├── hero/          # Slide 0 — ONJU
│   ├── story/         # Slide 1 — Origin story
│   ├── genesis/       # Slide 2 — Genesis + NFT gallery
│   ├── mint/          # Slide 3 — Mint interface
│   ├── community/     # Slides 4, 6, 8 — HBCU, Live, Socials
│   ├── gallery/       # Slide 5 — Generative art
│   └── watch/         # Slide 7 — VOD streams
├── components/
│   ├── NavigationDots.tsx
│   ├── NFTGallery.tsx
│   ├── NFTGalleryGrid.tsx
│   └── NFTDetailModal.tsx
├── hooks/
│   ├── useStore.tsx    # Global state + Thirdweb client + on-chain supply
│   ├── useNFT.ts       # ETH price + NFT metadata queries
│   └── useSlideScroll.ts
└── lib/
    └── constants.ts    # Contract address + IPFS CIDs
```

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

No `.env` required for local dev — the contract address, IPFS CIDs, and Thirdweb client ID are all in `src/lib/constants.ts` and `src/hooks/useStore.tsx`.

---

## License

All rights reserved — Ohnahji LLC
