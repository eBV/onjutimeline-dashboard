// Site config: the owner's live controls for the timeline site.
//
// One versioned document, stored under the KV key site:config (see
// api/_store.js). Defaults live here AND in the client
// (src/lib/siteConfig.ts, derived from src/lib/deck.ts); a unit test
// keeps the two copies identical. Stored values override defaults by
// merge; anything missing, malformed, or unreachable falls back to the
// defaults, so a config problem can never break the site.
//
// Shape:
//   {
//     version: 1,
//     slides:   { "/story": { visible: true, hex: "#F1C40F" }, ... },
//     features: { mintPill: true, quotesVoting: true,
//                 twitchVodRows: true, antiPhishingLine: true }
//   }
//
// The hero slide "/" can never be hidden: merge, normalize, and the
// client deck all force it visible so the deck can never be empty.

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/

// Every slide the panel can control: the public deck plus the gated
// pair, in deck order. The admin slide is deliberately absent: it is
// not part of the public deck config and can never be toggled.
export const KNOWN_SLIDE_PATHS = [
  '/', '/story', '/genesis', '/mint', '/community', '/art', '/merch',
  '/live', '/lens', '/quotes', '/socials', '/vault', '/firstlook',
]

export const FEATURE_KEYS = ['mintPill', 'quotesVoting', 'twitchVodRows', 'antiPhishingLine']

// Default hexes mirror src/lib/deck.ts exactly (drift-tested).
export const DEFAULT_CONFIG = {
  version: 1,
  slides: {
    '/': { visible: true, hex: '#3C0010' },
    '/story': { visible: true, hex: '#F1C40F' },
    '/genesis': { visible: true, hex: '#FE517E' },
    '/mint': { visible: true, hex: '#3C0010' },
    '/community': { visible: true, hex: '#FE517E' },
    '/art': { visible: true, hex: '#3C0010' },
    '/merch': { visible: true, hex: '#FFFFFF' },
    '/live': { visible: true, hex: '#FE517E' },
    '/lens': { visible: true, hex: '#3C0010' },
    '/quotes': { visible: true, hex: '#FE517E' },
    '/socials': { visible: true, hex: '#F1C40F' },
    '/vault': { visible: true, hex: '#3C0010' },
    '/firstlook': { visible: true, hex: '#3C0010' },
  },
  features: {
    mintPill: true,
    quotesVoting: true,
    twitchVodRows: true,
    antiPhishingLine: true,
  },
}

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_CONFIG))

// Defensive merge: stored values win only when they are well-formed.
// Used for reads (the effective config) and to normalize a validated
// PUT body into the complete document that gets stored.
export const mergeSiteConfig = (stored) => {
  const out = cloneDefaults()
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    const slides = stored.slides
    if (slides && typeof slides === 'object' && !Array.isArray(slides)) {
      for (const [path, entry] of Object.entries(slides)) {
        if (!KNOWN_SLIDE_PATHS.includes(path)) continue
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
        if (typeof entry.visible === 'boolean') out.slides[path].visible = entry.visible
        if (typeof entry.hex === 'string' && HEX_RE.test(entry.hex)) out.slides[path].hex = entry.hex
      }
    }
    const features = stored.features
    if (features && typeof features === 'object' && !Array.isArray(features)) {
      for (const key of FEATURE_KEYS) {
        if (typeof features[key] === 'boolean') out.features[key] = features[key]
      }
    }
  }
  out.slides['/'].visible = true
  return out
}

export const normalizeSiteConfig = (input) => mergeSiteConfig(input)

// Strict validation for writes. Unknown keys anywhere are rejected so
// a typo in the panel can never silently store a dead setting.
export const validateSiteConfig = (input) => {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['config must be an object'] }
  }
  for (const key of Object.keys(input)) {
    if (!['version', 'slides', 'features'].includes(key)) errors.push(`unknown key: ${key}`)
  }
  if (input.version !== 1) errors.push('version must be 1')

  if (!input.slides || typeof input.slides !== 'object' || Array.isArray(input.slides)) {
    errors.push('slides must be an object')
  } else {
    for (const [path, entry] of Object.entries(input.slides)) {
      if (!KNOWN_SLIDE_PATHS.includes(path)) {
        errors.push(`unknown slide path: ${path}`)
        continue
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`slides.${path} must be an object`)
        continue
      }
      for (const key of Object.keys(entry)) {
        if (!['visible', 'hex'].includes(key)) errors.push(`unknown key: slides.${path}.${key}`)
      }
      if ('visible' in entry && typeof entry.visible !== 'boolean') {
        errors.push(`slides.${path}.visible must be a boolean`)
      }
      if ('hex' in entry && (typeof entry.hex !== 'string' || !HEX_RE.test(entry.hex))) {
        errors.push(`slides.${path}.hex must be a #RRGGBB hex colour`)
      }
    }
  }

  if (!input.features || typeof input.features !== 'object' || Array.isArray(input.features)) {
    errors.push('features must be an object')
  } else {
    for (const [key, value] of Object.entries(input.features)) {
      if (!FEATURE_KEYS.includes(key)) {
        errors.push(`unknown feature: ${key}`)
        continue
      }
      if (typeof value !== 'boolean') errors.push(`features.${key} must be a boolean`)
    }
  }

  return { ok: errors.length === 0, errors }
}
