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
      version: 1,
      slides: { '/story': { visible: false, hex: '#00FF00' }, '/quotes': { hex: '#111111' } },
      features: { quotesVoting: false },
    }
    for (const merged of [mergeServer(stored), mergeClient(stored)]) {
      expect(merged.slides['/story']).toEqual({ visible: false, hex: '#00FF00' })
      expect(merged.slides['/quotes']).toEqual({ visible: true, hex: '#111111' })
      expect(merged.slides['/socials']).toEqual({ visible: true, hex: '#F1C40F' })
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
      expect(merged.slides['/story']).toEqual({ visible: true, hex: '#F1C40F' })
      expect(merged.slides['/art']).toEqual({ visible: true, hex: '#3C0010' })
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
})

describe('validation (strict, for writes)', () => {
  test('accepts the full default config', () => {
    expect(validateSiteConfig(validConfig())).toEqual({ ok: true, errors: [] })
  })

  test('accepts a partial slides map and missing feature entries', () => {
    const cfg = { version: 1, slides: { '/story': { visible: false } }, features: {} }
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
    cfg.version = 2
    expect(validateSiteConfig(cfg).ok).toBe(false)
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
