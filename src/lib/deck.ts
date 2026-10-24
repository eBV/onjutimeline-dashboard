// Deck composition: the single source of truth for which slides exist.
//
// The base deck is always present, in the stored order. Every slide
// carries a gate from the site config: "public" (everyone), "wallet"
// (any connected wallet, no ownership check), or "og" (a proven OG
// holder, balanceOf > 0 on the OG contract; see useHolderStatus).
// Slides whose gate is not satisfied are absent from the deck, the
// dots, and deep links, exactly as the old holder-only pair behaved.
// Every index-based system in the app (dots, chrome tint stops, deep
// links, scroll lock) derives from the visible deck returned here, so
// a wallet connecting, or a gate changing, reshapes the deck without
// a reload. The hero "/" is always first and always visible; the
// ADMIN slide is always last and admin-only.

import type { SlideGate } from './siteConfig'

export interface SlideMeta {
  path: string
  name: string
  // Browser chrome colour for this slide; written to the theme-color meta
  // tag and interpolated across the shell while swiping.
  hex: string
  shellClass: string
  gated?: boolean
  adminOnly?: boolean
  // Resolved font weight for the slide's header copy (per-slide
  // override, else sitewide, else undefined = as designed). The shell
  // writes it as a --slide-weight CSS variable on the slide wrapper.
  weight?: number
}

export const BASE_SLIDES: SlideMeta[] = [
  { path: '/', name: 'ONJU', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy' },
  { path: '/story', name: 'STORY', hex: '#F1C40F', shellClass: 'bg-ohnahji-gold' },
  { path: '/genesis', name: 'GENESIS', hex: '#FE517E', shellClass: 'bg-ohnahji-pink' },
  { path: '/mint', name: 'MINT', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy' },
  { path: '/community', name: 'HBCU', hex: '#FE517E', shellClass: 'bg-ohnahji-pink' },
  { path: '/art', name: 'ART', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy' },
  { path: '/merch', name: 'MERCH', hex: '#FFFFFF', shellClass: 'bg-ohnahji-white' },
  { path: '/live', name: 'LIVE', hex: '#FE517E', shellClass: 'bg-ohnahji-pink' },
  // Lens slide background is the brand maroon (was black); the Lens-green
  // accents live inside the slide.
  { path: '/lens', name: 'LENS', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy' },
  // Quotes: white room, colourful cards. Public; voting is wallet
  // sign-in gated (any wallet), not holder gated.
  { path: '/quotes', name: 'QUOTES', hex: '#FE517E', shellClass: 'bg-ohnahji-pink' },
  { path: '/socials', name: 'SOCIALS', hex: '#F1C40F', shellClass: 'bg-ohnahji-gold' },
]

export const GATED_SLIDES: SlideMeta[] = [
  { path: '/vault', name: 'VAULT', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy', gated: true },
  { path: '/firstlook', name: 'FIRST LOOK', hex: '#3C0010', shellClass: 'bg-ohnahji-burgundy', gated: true },
]

export const GATED_PATHS: string[] = GATED_SLIDES.map((s) => s.path)

// The ADMIN slide is stricter than any gate: it exists only while the
// connected wallet is the site owner (src/lib/admin.ts). It is not
// part of the public deck config, never appears in the site-config
// document, and can never be toggled off. It appends after every other
// slide, at the very end of the deck.
export const ADMIN_SLIDE: SlideMeta = {
  path: '/admin',
  name: 'ADMIN',
  hex: '#000000',
  shellClass: 'bg-ohnahji-black',
  adminOnly: true,
}

// The wallet state a gate is judged against. While the session is
// still restoring or the balance is still reading, the caller treats
// the state as pending and waits rather than bouncing a gated deep
// link (see App.tsx); this function itself is pure and strict.
export interface GateStatus {
  isConnected: boolean
  isHolder: boolean
}

export const gateSatisfied = (gate: SlideGate, status: GateStatus): boolean => {
  if (gate === 'public') return true
  if (gate === 'wallet') return status.isConnected
  return status.isHolder
}

// A partial site-config slide map (src/lib/siteConfig.ts): visibility,
// background-hex, gate, and weight overrides keyed by slide path.
export interface SlideConfigOverrides {
  [path: string]: { visible?: boolean; hex?: string; gate?: SlideGate; weight?: number | null } | undefined
}

export interface DeckOptions {
  isAdmin?: boolean
  slideConfig?: SlideConfigOverrides
  order?: string[]
  fontWeight?: number | null
}

const ALL_SLIDES = [...BASE_SLIDES, ...GATED_SLIDES]

// The visible deck: gates first (a slide whose gate is unsatisfied is
// absent for this visitor), then the owner's site-config overrides
// (hidden slides drop out for EVERY visitor; a hex override replaces
// the slide's chrome colour), ordered by the stored order with the
// hero pinned first, then the admin slide for the owner only. The
// hero "/" is always visible so the deck can never be empty.
export const visibleSlides = (status: GateStatus, opts: DeckOptions = {}): SlideMeta[] => {
  const order = opts.order
  const orderValid =
    Array.isArray(order) &&
    order.length === ALL_SLIDES.length &&
    order[0] === '/' &&
    ALL_SLIDES.every((s) => order.includes(s.path)) &&
    new Set(order).size === order.length
  const ordered = orderValid
    ? (order as string[]).map((p) => ALL_SLIDES.find((s) => s.path === p) as SlideMeta)
    : [...ALL_SLIDES]

  const configured = ordered
    .filter((slide) => {
      if (slide.path === '/') return true
      const entry = opts.slideConfig?.[slide.path]
      if (entry?.visible === false) return false
      const gate: SlideGate = entry?.gate ?? (slide.gated ? 'og' : 'public')
      return gateSatisfied(gate, status)
    })
    .map((slide) => {
      const entry = opts.slideConfig?.[slide.path]
      const hex = entry?.hex
      const weight = entry?.weight ?? opts.fontWeight ?? undefined
      return {
        ...slide,
        ...(hex ? { hex } : {}),
        ...(weight ? { weight } : {}),
      }
    })
  return opts.isAdmin ? [...configured, ADMIN_SLIDE] : configured
}
