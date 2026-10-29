// @ts-expect-error plain JS API modules have no type declarations
import { DEFAULT_CONFIG, KNOWN_SLIDE_PATHS, FEATURE_KEYS, mergeSiteConfig as mergeServer, validateSiteConfig } from '../../api/_config.js'
import { DEFAULT_SITE_CONFIG, mergeSiteConfig as mergeClient } from '../lib/siteConfig'
import { BASE_SLIDES, GATED_SLIDES } from '../lib/deck'

const validConfig = () => JSON.parse(JSON.stringify(DEFAULT_CONFIG))

describe('defaults stay in sync', () => {
  test('server defaults equal the client defaults derived from the deck', () => {
    expect(DEFAULT_CONFIG).toEqual(DEFAULT_SITE_CONFIG)
  })

  test('known slide paths are exactly the deck slides in order', () => {
    expect(KNOWN_SLIDE_PATHS).toEqual([...BASE_SLIDES, ...GATED_SLIDES].map((s) => s.path))
  })

  test('every default hex matches its deck hex', () => {
    for (const slide of [...BASE_SLIDES, ...GATED_SLIDES]) {
      expect(DEFAULT_CONFIG.slides[slide.path].hex).toBe(slide.hex)
      expect(DEFAULT_CONFIG.slides[slide.path].visible).toBe(true)
    }
  })

  test('feature keys cover the four switches', () => {
    expect([...FEATURE_KEYS].sort()).toEqual(
      ['antiPhishingLine', 'mintPill', 'quotesVoting', 'twitchVodRows'],
    )
  })
})

describe('merge (server and client agree)', () => {
  test('null stored yields the defaults', () => {
    expect(mergeServer(null)).toEqual(DEFAULT_CONFIG)
    expect(mergeClient(null)).toEqual(DEFAULT_SITE_CONFIG)
    expect(mergeServer(undefined)).toEqual(DEFAULT_CONFIG)
  })

  test('stored values override by merge, both implementations', () => {
    const stored = {
      version: 2,
      slides: { '/story': { visible: false, hex: '#00FF00' }, '/quotes': { hex: '#111111' } },
      features: { quotesVoting: false },
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.slides['/story'].visible).toBe(false)
      expect(merged.slides['/story'].hex).toBe('#00FF00')
      expect(merged.slides['/quotes'].visible).toBe(true)
      expect(merged.slides['/quotes'].hex).toBe('#111111')
      expect(merged.slides['/socials'].hex).toBe('#F1C40F')
      expect(merged.features.quotesVoting).toBe(false)
      expect(merged.features.mintPill).toBe(true)
    }
  })

  test('malformed stored values are ignored, never fatal', () => {
    const stored = {
      slides: { '/story': { visible: 'yes', hex: 'blue' }, '/nope': { visible: false }, '/art': 'gone' },
      features: { mintPill: 1, bogus: false },
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.slides['/story'].visible).toBe(true)
      expect(merged.slides['/story'].hex).toBe('#F1C40F')
      expect(merged.slides['/art'].hex).toBe('#3C0010')
      expect(merged.features.mintPill).toBe(true)
      expect((merged.features as any).bogus).toBeUndefined()
      expect((merged.slides as any)['/nope']).toBeUndefined()
    }
  })

  test('the hero slide is forced visible even when stored hidden', () => {
    const stored = { slides: { '/': { visible: false } } }
    expect(mergeServer(stored).slides['/'].visible).toBe(true)
    expect(mergeClient(stored).slides['/'].visible).toBe(true)
  })

  test('the hero slide is forced public even when stored gated', () => {
    const stored = { slides: { '/': { gate: 'og' } } }
    expect(mergeServer(stored).slides['/'].gate).toBe('public')
    expect(mergeClient(stored).slides['/'].gate).toBe('public')
  })

  test('a version 1 document migrates: new fields fall back to defaults', () => {
    const stored = {
      version: 1,
      slides: { '/story': { visible: false, hex: '#00FF00' } },
      features: { quotesVoting: false },
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.version).toBe(2)
      expect(merged.slides['/story'].visible).toBe(false)
      expect(merged.slides['/story'].gate).toBe('public')
      expect(merged.slides['/story'].weight).toBeNull()
      expect(merged.slides['/story'].copy.heading).toBe('How We\nGot Here')
      expect(merged.slides['/vault'].gate).toBe('og')
      expect(merged.order[0]).toBe('/')
      expect(merged.order).toHaveLength(15)
      expect(merged.fontWeight).toBeNull()
      expect(merged.features.quotesVoting).toBe(false)
    }
  })

  test('order, gates, weights, and copy merge when well-formed', () => {
    const stored = {
      version: 2,
      order: ['/', '/quotes', '/story', '/genesis', '/mint', '/community', '/art', '/live', '/lens', '/socials', '/faq', '/muralith', '/exchangent', '/vault', '/firstlook'],
      fontWeight: 300,
      slides: {
        '/art': { gate: 'wallet', weight: 800, copy: { heading: 'New Art', paragraph: 'New intro' } },
        '/quotes': { copy: { heading: 'Board' } },
      },
      features: {},
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.order[1]).toBe('/quotes')
      expect(merged.fontWeight).toBe(300)
      expect(merged.slides['/art'].gate).toBe('wallet')
      expect(merged.slides['/art'].weight).toBe(800)
      expect(merged.slides['/art'].copy).toEqual({ heading: 'New Art', paragraph: 'New intro' })
      expect(merged.slides['/quotes'].copy.heading).toBe('Board')
      expect(merged.slides['/quotes'].copy.paragraph).toMatch(/ranked by the community/)
    }
  })

  test('malformed order, gates, weights, and copy fall back to defaults', () => {
    const stored = {
      order: ['/', '/story'],
      fontWeight: 900,
      slides: {
        '/art': { gate: 'everyone', weight: 250, copy: { heading: 'x'.repeat(301), paragraph: 42 } },
      },
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.order[0]).toBe('/')
      expect(merged.order).toHaveLength(15)
      expect(merged.fontWeight).toBeNull()
      expect(merged.slides['/art'].gate).toBe('public')
      expect(merged.slides['/art'].weight).toBeNull()
      expect(merged.slides['/art'].copy.heading).toBe('OKOLOTOS & ELEMNTS')
      expect(merged.slides['/art'].copy.paragraph).toBe('Code-based artistic expression')
    }
  })
})

describe('validation (strict, for writes)', () => {
  test('accepts the full default config', () => {
    expect(validateSiteConfig(validConfig())).toEqual({ ok: true, errors: [] })
  })

  test('accepts a partial slides map and missing feature entries', () => {
    const cfg = validConfig()
    cfg.slides = { '/story': { visible: false } }
    cfg.features = {}
    expect(validateSiteConfig(cfg).ok).toBe(true)
  })

  test('rejects a non-object', () => {
    expect(validateSiteConfig(null).ok).toBe(false)
    expect(validateSiteConfig('config').ok).toBe(false)
    expect(validateSiteConfig([1, 2]).ok).toBe(false)
  })

  test('rejects an unknown top-level key', () => {
    const cfg = validConfig()
    cfg.extra = true
    const { ok, errors } = validateSiteConfig(cfg)
    expect(ok).toBe(false)
    expect(errors.join(' ')).toMatch(/unknown key: extra/)
  })

  test('rejects the wrong version', () => {
    const cfg = validConfig()
    cfg.version = 1
    expect(validateSiteConfig(cfg).ok).toBe(false)
  })

  test('rejects a bad order, gate, weight, and copy', () => {
    const badOrder = validConfig()
    badOrder.order = ['/', '/story']
    expect(validateSiteConfig(badOrder).ok).toBe(false)
    const heroSecond = validConfig()
    heroSecond.order = [...heroSecond.order.slice(1), heroSecond.order[0]]
    expect(validateSiteConfig(heroSecond).ok).toBe(false)
    const badGate = validConfig()
    badGate.slides['/art'].gate = 'everyone'
    expect(validateSiteConfig(badGate).ok).toBe(false)
    const badWeight = validConfig()
    badWeight.slides['/art'].weight = 900
    expect(validateSiteConfig(badWeight).ok).toBe(false)
    const badFontWeight = validConfig()
    badFontWeight.fontWeight = 250
    expect(validateSiteConfig(badFontWeight).ok).toBe(false)
    const longCopy = validConfig()
    longCopy.slides['/art'].copy.heading = 'x'.repeat(301)
    expect(validateSiteConfig(longCopy).ok).toBe(false)
    const badCopyKey = validConfig()
    badCopyKey.slides['/art'].copy.subline = 'hi'
    expect(validateSiteConfig(badCopyKey).ok).toBe(false)
  })

  test('rejects an unknown slide path, including /admin', () => {
    const cfg = validConfig()
    cfg.slides['/admin'] = { visible: true, hex: '#000000' }
    const { ok, errors } = validateSiteConfig(cfg)
    expect(ok).toBe(false)
    expect(errors.join(' ')).toMatch(/unknown slide path: \/admin/)
  })

  test('rejects a malformed hex', () => {
    for (const hex of ['#FFF', 'F1C40F', '#GGGGGG', '#F1C40', 123]) {
      const cfg = validConfig()
      cfg.slides['/story'].hex = hex
      expect(validateSiteConfig(cfg).ok).toBe(false)
    }
  })

  test('rejects a non-boolean visible', () => {
    const cfg = validConfig()
    cfg.slides['/story'].visible = 'false'
    expect(validateSiteConfig(cfg).ok).toBe(false)
  })

  test('rejects an unknown key inside a slide entry', () => {
    const cfg = validConfig()
    cfg.slides['/story'].pinned = true
    const { ok, errors } = validateSiteConfig(cfg)
    expect(ok).toBe(false)
    expect(errors.join(' ')).toMatch(/unknown key: slides\.\/story\.pinned/)
  })

  test('rejects an unknown feature and a non-boolean feature', () => {
    const cfg = validConfig()
    cfg.features.darkMode = true
    expect(validateSiteConfig(cfg).ok).toBe(false)
    const cfg2 = validConfig()
    cfg2.features.mintPill = 'off'
    expect(validateSiteConfig(cfg2).ok).toBe(false)
  })
})
