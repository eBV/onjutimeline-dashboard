// Site config: the owner's live controls for the timeline site.
//
// One versioned document, stored under the KV key site:config (see
// api/_store.js). Defaults live here AND in the client
// (src/lib/siteConfig.ts); a unit test keeps the two copies identical.
// Stored values override defaults by merge; anything missing,
// malformed, or unreachable falls back to the defaults, so a config
// problem can never break the site.
//
// Shape (version 2):
//   {
//     version: 2,
//     order: ['/', '/story', ...],          // deck order, hero first
//     fontWeight: null | 300..800,          // sitewide, null = as designed
//     slides: { "/story": {
//       visible: true, hex: "#F1C40F",
//       gate: "public" | "wallet" | "og",
//       weight: null | 300..800,             // null = inherit sitewide
//       copy: { heading: "...", paragraph: "..." }
//     }, ... },
//     features: { mintPill: true, quotesVoting: true,
//                 twitchVodRows: true, antiPhishingLine: true }
//   }
//
// Version 1 documents (visibility + hex + features only) migrate by
// merge: every new field falls back to its default, so an old stored
// document keeps working and the next panel save writes version 2.
//
// The hero slide "/" can never be hidden or gated: merge, normalize,
// and the client deck all force it visible and public, so the deck can
// never be empty and a visitor can never be locked out of home.

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/

// Every slide the panel can control: the public deck plus the gated
// pair, in deck order. The admin slide is deliberately absent: it is
// not part of the public deck config and can never be toggled.
export const KNOWN_SLIDE_PATHS = [
  '/', '/story', '/genesis', '/mint', '/community', '/art', '/merch',
  '/live', '/lens', '/quotes', '/socials', '/vault', '/firstlook',
]

export const FEATURE_KEYS = ['mintPill', 'quotesVoting', 'twitchVodRows', 'antiPhishingLine']

// Who may see a slide. "public" is everyone; "wallet" is any connected
// wallet (no ownership check); "og" is a proven OG-holder wallet (the
// same balanceOf check the old gated pair used).
export const GATE_VALUES = ['public', 'wallet', 'og']
export const DEFAULT_GATES = {
  '/vault': 'og',
  '/firstlook': 'og',
}

// Font-weight steps offered by the panel (Tailwind scale, minus 900:
// headings already sit at 900 by design, and the panel steps down from
// there). null means "as designed" sitewide or "inherit sitewide" per
// slide. Weights never change sizes or spacing.
export const WEIGHT_STEPS = [300, 400, 500, 600, 700, 800]
export const COPY_MAX_CHARS = 300

// Default heading + paragraph per slide, mirroring the literals the
// slides shipped with (drift-tested against src/lib/siteConfig.ts).
// Headings and paragraphs may contain "\n" for a line break; the
// slides render each line separated by a <br />. The Story slide has
// no intro paragraph of its own, so its paragraph field controls the
// closest subline under its header: the MoDDA Proof of Culture band
// body, the first body paragraph on that slide.
export const DEFAULT_COPY = {
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
  '/vault': {
    heading: 'The Vault',
    paragraph: 'A Grove-powered locker for OG Ohnahji holders. Bring a file, leave with a link only your wallet controls.',
  },
  '/firstlook': {
    heading: 'First Look',
    paragraph: 'Two worlds in the workshop, opened early for OG holders: the Alphites stadium and the new campus.',
  },
}

// Default hexes mirror src/lib/deck.ts exactly (drift-tested).
export const DEFAULT_CONFIG = {
  version: 2,
  order: [...KNOWN_SLIDE_PATHS],
  fontWeight: null,
  slides: {
    '/': { visible: true, hex: '#3C0010', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/'] } },
    '/story': { visible: true, hex: '#F1C40F', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/story'] } },
    '/genesis': { visible: true, hex: '#FE517E', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/genesis'] } },
    '/mint': { visible: true, hex: '#3C0010', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/mint'] } },
    '/community': { visible: true, hex: '#FE517E', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/community'] } },
    '/art': { visible: true, hex: '#3C0010', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/art'] } },
    '/merch': { visible: true, hex: '#FFFFFF', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/merch'] } },
    '/live': { visible: true, hex: '#FE517E', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/live'] } },
    '/lens': { visible: true, hex: '#3C0010', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/lens'] } },
    '/quotes': { visible: true, hex: '#FE517E', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/quotes'] } },
    '/socials': { visible: true, hex: '#F1C40F', gate: 'public', weight: null, copy: { ...DEFAULT_COPY['/socials'] } },
    '/vault': { visible: true, hex: '#3C0010', gate: 'og', weight: null, copy: { ...DEFAULT_COPY['/vault'] } },
    '/firstlook': { visible: true, hex: '#3C0010', gate: 'og', weight: null, copy: { ...DEFAULT_COPY['/firstlook'] } },
  },
  features: {
    mintPill: true,
    quotesVoting: true,
    twitchVodRows: true,
    antiPhishingLine: true,
  },
}

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_CONFIG))

const isWeight = (v) => v === null || WEIGHT_STEPS.includes(v)

// An order is usable only as an exact permutation of the known paths
// with the hero first; anything else falls back to the default order.
export const isValidOrder = (order) =>
  Array.isArray(order) &&
  order.length === KNOWN_SLIDE_PATHS.length &&
  order[0] === '/' &&
  KNOWN_SLIDE_PATHS.every((p) => order.includes(p)) &&
  new Set(order).size === order.length

// Defensive merge: stored values win only when they are well-formed.
// Used for reads (the effective config) and to normalize a validated
// PUT body into the complete document that gets stored. A version 1
// document merges cleanly: its missing fields all fall back to the
// version 2 defaults.
export const mergeSiteConfig = (stored) => {
  const out = cloneDefaults()
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    if (isValidOrder(stored.order)) out.order = [...stored.order]
    if (isWeight(stored.fontWeight)) out.fontWeight = stored.fontWeight
    const slides = stored.slides
    if (slides && typeof slides === 'object' && !Array.isArray(slides)) {
      for (const [path, entry] of Object.entries(slides)) {
        if (!KNOWN_SLIDE_PATHS.includes(path)) continue
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
        const target = out.slides[path]
        if (typeof entry.visible === 'boolean') target.visible = entry.visible
        if (typeof entry.hex === 'string' && HEX_RE.test(entry.hex)) target.hex = entry.hex
        if (typeof entry.gate === 'string' && GATE_VALUES.includes(entry.gate)) target.gate = entry.gate
        if (isWeight(entry.weight)) target.weight = entry.weight
        if (entry.copy && typeof entry.copy === 'object' && !Array.isArray(entry.copy)) {
          if (typeof entry.copy.heading === 'string' && entry.copy.heading.length <= COPY_MAX_CHARS) {
            target.copy.heading = entry.copy.heading
          }
          if (typeof entry.copy.paragraph === 'string' && entry.copy.paragraph.length <= COPY_MAX_CHARS) {
            target.copy.paragraph = entry.copy.paragraph
          }
        }
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
  out.slides['/'].gate = 'public'
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
    if (!['version', 'order', 'fontWeight', 'slides', 'features'].includes(key)) {
      errors.push(`unknown key: ${key}`)
    }
  }
  if (input.version !== 2) errors.push('version must be 2')

  if (!isValidOrder(input.order)) {
    errors.push('order must be a permutation of the known slide paths with "/" first')
  }
  if (!isWeight(input.fontWeight)) {
    errors.push('fontWeight must be null or one of 300, 400, 500, 600, 700, 800')
  }

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
        if (!['visible', 'hex', 'gate', 'weight', 'copy'].includes(key)) {
          errors.push(`unknown key: slides.${path}.${key}`)
        }
      }
      if ('visible' in entry && typeof entry.visible !== 'boolean') {
        errors.push(`slides.${path}.visible must be a boolean`)
      }
      if ('hex' in entry && (typeof entry.hex !== 'string' || !HEX_RE.test(entry.hex))) {
        errors.push(`slides.${path}.hex must be a #RRGGBB hex colour`)
      }
      if ('gate' in entry && !GATE_VALUES.includes(entry.gate)) {
        errors.push(`slides.${path}.gate must be one of public, wallet, og`)
      }
      if ('weight' in entry && !isWeight(entry.weight)) {
        errors.push(`slides.${path}.weight must be null or one of 300, 400, 500, 600, 700, 800`)
      }
      if ('copy' in entry) {
        if (!entry.copy || typeof entry.copy !== 'object' || Array.isArray(entry.copy)) {
          errors.push(`slides.${path}.copy must be an object`)
        } else {
          for (const key of Object.keys(entry.copy)) {
            if (!['heading', 'paragraph'].includes(key)) {
              errors.push(`unknown key: slides.${path}.copy.${key}`)
            }
          }
          for (const field of ['heading', 'paragraph']) {
            if (field in entry.copy) {
              const value = entry.copy[field]
              if (typeof value !== 'string') errors.push(`slides.${path}.copy.${field} must be a string`)
              else if (value.length > COPY_MAX_CHARS) {
                errors.push(`slides.${path}.copy.${field} must be at most ${COPY_MAX_CHARS} characters`)
              }
            }
          }
        }
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
