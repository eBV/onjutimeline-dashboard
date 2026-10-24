// Deck composition: the single source of truth for which slides exist.
//
// The base deck is always present, in this order. The gated pair appends
// after it, in order, only while the connected wallet is a proven OG
// holder (balanceOf > 0 on the OG contract; see useHolderStatus). Every
// index-based system in the app (dots, chrome tint stops, deep links,
// scroll lock) derives from the visible deck returned here, so a wallet
// flipping holder state mid-session grows or shrinks the deck without a
// reload and without moving the user off a base slide (gated slides
// append at the end, so base indexes never shift).

export interface SlideMeta {
  path: string
  name: string
  // Browser chrome colour for this slide; written to the theme-color meta
  // tag and interpolated across the shell while swiping.
  hex: string
  shellClass: string
  gated?: boolean
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

export const visibleSlides = (isHolder: boolean): SlideMeta[] =>
  isHolder ? [...BASE_SLIDES, ...GATED_SLIDES] : [...BASE_SLIDES]
