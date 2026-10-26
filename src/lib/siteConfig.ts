import { useQuery } from '@tanstack/react-query'
import { BASE_SLIDES, GATED_SLIDES } from './deck'

// Site config on the client: the owner's live controls (slide
// visibility, background hex, gate, font weight, heading + paragraph
// copy, feature switches), served by GET /api/site-config and edited
// from the hidden ADMIN tab.
//
// Defaults are derived from the deck itself, so the site renders
// identically before the fetch lands, when the fetch fails, and when
// the backend has nothing stored. The server keeps its own copy of
// the defaults in api/_config.js; a unit test keeps them identical.

export type SlideGate = 'public' | 'wallet' | 'og'

export interface SlideCopy {
  heading: string
  paragraph: string
}

export interface SlideConfigEntry {
  visible: boolean
  hex: string
  gate: SlideGate
  weight: number | null
  copy: SlideCopy
}

export interface SiteFeatures {
  mintPill: boolean
  quotesVoting: boolean
  twitchVodRows: boolean
  antiPhishingLine: boolean
}

export interface SiteConfig {
  version: 2
  order: string[]
  fontWeight: number | null
  slides: Record<string, SlideConfigEntry>
  features: SiteFeatures
}

export const FEATURE_KEYS: (keyof SiteFeatures)[] = [
  'mintPill',
  'quotesVoting',
  'twitchVodRows',
  'antiPhishingLine',
]

export const GATE_VALUES: SlideGate[] = ['public', 'wallet', 'og']

export const WEIGHT_STEPS = [300, 400, 500, 600, 700, 800]

export const COPY_MAX_CHARS = 300

// Default gates: the old holder-only pair stays OG-gated; everything
// else is public. The hero's gate is forced public by merge.
export const DEFAULT_GATES: Record<string, SlideGate> = {
  '/vault': 'og',
  '/firstlook': 'og',
  '/exchangent': 'og',
}

// Default heading + paragraph per slide, mirroring the literals the
// slides shipped with (drift-tested against api/_config.js). "\n" is
// a line break; slides render each line separated by a <br />. The
// Story slide has no intro paragraph of its own, so its paragraph
// field controls the closest subline under its header: the MoDDA
// Proof of Culture band body.
export const DEFAULT_COPY: Record<string, SlideCopy> = {
  '/': {
    heading: 'Ohnahji',
    paragraph: 'Your Homebase For Learning\nEmerging Technologies',
  },
  '/story': {
    heading: 'How We\nGot Here',
    paragraph: 'Ohnahji PFPs #2513 and #2514 exhibited in MoDDA\u2019s Proof of Culture (2022 room, THE DIVERGENCE), curated by Sian A. Morson.',
  },
  '/genesis': {
    heading: 'The\nGenesis',
    paragraph: 'MLK Weekend Launch. The beginning of something revolutionary in the NFT space.',
  },
  '/mint': {
    heading: 'Spring \u201926\ndrop',
    paragraph: 'Limited edition mint. Join the revolution.',
  },
  '/community': {
    heading: 'The HBCU\npivot',
    paragraph: 'Education meets innovation. Building the future of creative communities.',
  },
  '/art': {
    heading: 'OKOLOTOS & ELEMNTS',
    paragraph: 'Code-based artistic expression',
  },
  '/merch': {
    heading: 'Campus Shop',
    paragraph: 'Rep the first Web3 HBCU. Official Ohnahji U gear from the Campus Shop on Creator Spring.',
  },
  '/live': {
    heading: 'Livestream era',
    paragraph: 'Watch live on Twitch and YouTube',
  },
  '/lens': {
    heading: '@ohnahji.lens',
    paragraph: 'The latest from Ohnahji on Lens, straight from the chain.',
  },
  '/quotes': {
    heading: 'The Quotes Board',
    paragraph: 'Every pick from the daily stream, ranked by the community. Reading is free for everyone; voting takes any connected wallet.',
  },
  '/socials': {
    heading: 'Join the community',
    paragraph: 'Follow us across the web and stay updated on the latest in emerging tech.',
  },
  '/muralith': {
    heading: 'Muralith\nmint',
    paragraph: 'Muralith by Ohnahji crops a single deterministic window from an endless wall where strobe, bass pressure and torn flyers have sedimented into plaster. No two cuts are alike; each is sealed by its mint hash and ranked on a true percentile scale, so the top stays the top forever.',
  },
  '/vault': {
    heading: 'The Vault',
    paragraph: 'A Grove-powered locker for OG Ohnahji holders. Bring a file, leave with a link only your wallet controls.',
  },
  '/firstlook': {
    heading: 'First Look',
    paragraph: 'Two worlds in the workshop, opened early for OG holders: the Alphites stadium and the new campus.',
  },
  '/exchangent': {
    heading: 'The\nExchangent',
    paragraph: 'The insider map of the New Eden square: the marketplace, the Gallery, the Welcome House, and the Archive, open early for OG holders.',
  },
}

export const CONFIGURABLE_SLIDES = [...BASE_SLIDES, ...GATED_SLIDES]

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 2,
  order: CONFIGURABLE_SLIDES.map((s) => s.path),
  fontWeight: null,
  slides: Object.fromEntries(
    CONFIGURABLE_SLIDES.map((s) => [
      s.path,
      {
        visible: true,
        hex: s.hex,
        gate: DEFAULT_GATES[s.path] ?? 'public',
        weight: null,
        copy: { ...DEFAULT_COPY[s.path] },
      },
    ]),
  ),
  features: {
    mintPill: true,
    quotesVoting: true,
    twitchVodRows: true,
    antiPhishingLine: true,
  },
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

const isWeight = (v: unknown): v is number | null =>
  v === null || (typeof v === 'number' && WEIGHT_STEPS.includes(v))

const isValidOrder = (order: unknown): order is string[] =>
  Array.isArray(order) &&
  order.length === CONFIGURABLE_SLIDES.length &&
  order[0] === '/' &&
  CONFIGURABLE_SLIDES.every((s) => order.includes(s.path)) &&
  new Set(order).size === order.length

const cloneDefaults = (): SiteConfig => JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG))

// Defensive merge, mirroring api/_config.js: stored values win only
// when well-formed; the hero slide is always visible and public. A
// version 1 document (no order, gates, weights, or copy) merges
// cleanly, with every new field falling back to its default.
export const mergeSiteConfig = (raw: unknown): SiteConfig => {
  const out = cloneDefaults()
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const stored = raw as { order?: unknown; fontWeight?: unknown; slides?: unknown; features?: unknown }
    if (isValidOrder(stored.order)) out.order = [...stored.order]
    if (isWeight(stored.fontWeight)) out.fontWeight = stored.fontWeight
    if (stored.slides && typeof stored.slides === 'object' && !Array.isArray(stored.slides)) {
      for (const [path, entry] of Object.entries(stored.slides as Record<string, unknown>)) {
        const target = out.slides[path]
        if (!target || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue
        const e = entry as { visible?: unknown; hex?: unknown; gate?: unknown; weight?: unknown; copy?: unknown }
        if (typeof e.visible === 'boolean') target.visible = e.visible
        if (typeof e.hex === 'string' && HEX_RE.test(e.hex)) target.hex = e.hex
        if (typeof e.gate === 'string' && GATE_VALUES.includes(e.gate as SlideGate)) target.gate = e.gate as SlideGate
        if (isWeight(e.weight)) target.weight = e.weight
        if (e.copy && typeof e.copy === 'object' && !Array.isArray(e.copy)) {
          const c = e.copy as { heading?: unknown; paragraph?: unknown }
          if (typeof c.heading === 'string' && c.heading.length <= COPY_MAX_CHARS) target.copy.heading = c.heading
          if (typeof c.paragraph === 'string' && c.paragraph.length <= COPY_MAX_CHARS) target.copy.paragraph = c.paragraph
        }
      }
    }
    if (stored.features && typeof stored.features === 'object' && !Array.isArray(stored.features)) {
      for (const key of FEATURE_KEYS) {
        const value = (stored.features as Record<string, unknown>)[key]
        if (typeof value === 'boolean') out.features[key] = value
      }
    }
  }
  out.slides['/'].visible = true
  out.slides['/'].gate = 'public'
  return out
}

export const fetchSiteConfig = async (): Promise<SiteConfig> => {
  const res = await fetch('/api/site-config')
  if (!res.ok) throw new Error(`site-config responded ${res.status}`)
  const json = await res.json()
  return mergeSiteConfig(json?.config)
}

// Shared by the shell (deck, mint pill) and the feature consumers
// (Quotes voting, Live rows, Socials line). One query, ~60s stale.
export const useSiteConfig = () =>
  useQuery({
    queryKey: ['site-config'],
    queryFn: fetchSiteConfig,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })

// Per-slide live settings for a slide's own header: its editable
// heading + paragraph (code defaults when nothing is stored) and its
// resolved font weight: the per-slide override, else the sitewide
// weight, else null (as designed). Copy is rendered as plain text by
// the slides, never as HTML, so an edited string cannot inject markup.
export const useSlideSettings = (path: string): { copy: SlideCopy; weight: number | null } => {
  const { data } = useSiteConfig()
  const config = data ?? DEFAULT_SITE_CONFIG
  const entry = config.slides[path]
  return {
    copy: entry?.copy ?? DEFAULT_COPY[path],
    weight: entry?.weight ?? config.fontWeight ?? null,
  }
}

// Split a copy string on "\n" for rendering lines separated by <br />.
export const copyLines = (text: string): string[] => text.split('\n')
