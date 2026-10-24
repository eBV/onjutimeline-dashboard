import { useQuery } from '@tanstack/react-query'
import { BASE_SLIDES, GATED_SLIDES } from './deck'

// Site config on the client: the owner's live controls (slide
// visibility, per-slide background hex, feature switches), served by
// GET /api/site-config and edited from the hidden ADMIN tab.
//
// Defaults are derived from the deck itself, so the site renders
// identically before the fetch lands, when the fetch fails, and when
// the backend has nothing stored. The server keeps its own copy of
// the defaults in api/_config.js; a unit test keeps them identical.

export interface SlideConfigEntry {
  visible: boolean
  hex: string
}

export interface SiteFeatures {
  mintPill: boolean
  quotesVoting: boolean
  twitchVodRows: boolean
  antiPhishingLine: boolean
}

export interface SiteConfig {
  version: 1
  slides: Record<string, SlideConfigEntry>
  features: SiteFeatures
}

export const FEATURE_KEYS: (keyof SiteFeatures)[] = [
  'mintPill',
  'quotesVoting',
  'twitchVodRows',
  'antiPhishingLine',
]

export const CONFIGURABLE_SLIDES = [...BASE_SLIDES, ...GATED_SLIDES]

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 1,
  slides: Object.fromEntries(
    CONFIGURABLE_SLIDES.map((s) => [s.path, { visible: true, hex: s.hex }]),
  ),
  features: {
    mintPill: true,
    quotesVoting: true,
    twitchVodRows: true,
    antiPhishingLine: true,
  },
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

const cloneDefaults = (): SiteConfig => JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG))

// Defensive merge, mirroring api/_config.js: stored values win only
// when well-formed; the hero slide is always visible.
export const mergeSiteConfig = (raw: unknown): SiteConfig => {
  const out = cloneDefaults()
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const stored = raw as { slides?: unknown; features?: unknown }
    if (stored.slides && typeof stored.slides === 'object' && !Array.isArray(stored.slides)) {
      for (const [path, entry] of Object.entries(stored.slides as Record<string, unknown>)) {
        const target = out.slides[path]
        if (!target || !entry || typeof entry !== 'object' || Array.isArray(entry)) continue
        const e = entry as { visible?: unknown; hex?: unknown }
        if (typeof e.visible === 'boolean') target.visible = e.visible
        if (typeof e.hex === 'string' && HEX_RE.test(e.hex)) target.hex = e.hex
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
