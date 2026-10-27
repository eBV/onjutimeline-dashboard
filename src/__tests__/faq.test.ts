import { BASE_SLIDES, visibleSlides } from '../lib/deck'
import { DEFAULT_COPY, DEFAULT_SITE_CONFIG, COPY_MAX_CHARS } from '../lib/siteConfig'
import { FAQ_SECTIONS } from '../features/faq/faqData'

// Gate states: nobody (disconnected), holder.
const NOBODY = { isConnected: false, isHolder: false }
const HOLDER = { isConnected: true, isHolder: true }

// No em dash anywhere in shipped copy: the standing output rule.
const hasEmDash = (s: string) => s.includes('\u2014')

describe('faq slide', () => {
  test('faq sits after socials and is public', () => {
    const paths = BASE_SLIDES.map((s) => s.path)
    expect(paths.indexOf('/faq')).toBe(paths.indexOf('/socials') + 1)
    expect(BASE_SLIDES.find((s) => s.path === '/faq')?.name).toBe('FAQ')
    expect(BASE_SLIDES.find((s) => s.path === '/faq')?.gated).toBeFalsy()
  })

  test('non-holders see faq; holders still end with the gated pair', () => {
    const nobody = visibleSlides(NOBODY).map((s) => s.path)
    expect(nobody).toContain('/faq')
    const holder = visibleSlides(HOLDER).map((s) => s.path)
    expect(holder.slice(-2)).toEqual(['/vault', '/firstlook'])
  })

  test('default copy exists for faq and fits the admin cap', () => {
    const copy = DEFAULT_COPY['/faq']
    expect(copy.heading.length).toBeGreaterThan(0)
    expect(copy.paragraph.length).toBeGreaterThan(0)
    expect(copy.heading.length).toBeLessThanOrEqual(COPY_MAX_CHARS)
    expect(copy.paragraph.length).toBeLessThanOrEqual(COPY_MAX_CHARS)
    expect(DEFAULT_SITE_CONFIG.slides['/faq'].gate).toBe('public')
    expect(DEFAULT_SITE_CONFIG.slides['/faq'].visible).toBe(true)
    expect(hasEmDash(copy.heading)).toBe(false)
    expect(hasEmDash(copy.paragraph)).toBe(false)
  })

  test('faq has exactly the six required sections, each with questions', () => {
    expect(FAQ_SECTIONS.map((s) => s.title)).toEqual([
      'Getting started',
      'Minting',
      'Holders',
      'Stream',
      'Muralith',
      'New Eden',
    ])
    for (const section of FAQ_SECTIONS) {
      expect(section.items.length).toBeGreaterThanOrEqual(3)
      for (const item of section.items) {
        expect(item.q.length).toBeGreaterThan(0)
        expect(item.a.length).toBeGreaterThan(0)
        expect(hasEmDash(item.q)).toBe(false)
        expect(hasEmDash(item.a)).toBe(false)
      }
    }
  })

  test('faq carries the verified numbers, and muralith points at Highlight', () => {
    const all = FAQ_SECTIONS.flatMap((s) => s.items.map((i) => i.a)).join(' ')
    expect(all).toMatch(/0\.005 ETH/)
    expect(all).toMatch(/9,010/)
    expect(all).toMatch(/5,097/)
    expect(all).toMatch(/0\.0018 ETH/)
    expect(all).toMatch(/0\.0008 ETH/)
    expect(all).toMatch(/\(1,0\)/)
    expect(all).toMatch(/mint directly on Highlight/)
  })
})
