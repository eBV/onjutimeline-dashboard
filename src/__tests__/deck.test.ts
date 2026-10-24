import { BASE_SLIDES, GATED_SLIDES, GATED_PATHS, visibleSlides } from '../lib/deck'

describe('deck composition', () => {
  test('base deck is the 11 public slides in order', () => {
    expect(BASE_SLIDES.map((s) => s.path)).toEqual([
      '/', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/quotes', '/socials',
    ])
  })

  test('quotes sits in the base deck after lens and before socials', () => {
    const paths = BASE_SLIDES.map((s) => s.path)
    expect(paths.indexOf('/quotes')).toBe(paths.indexOf('/lens') + 1)
    expect(paths.indexOf('/quotes')).toBe(paths.indexOf('/socials') - 1)
    const quotes = BASE_SLIDES.find((s) => s.path === '/quotes')
    expect(quotes?.name).toBe('QUOTES')
    expect(quotes?.gated).toBeFalsy()
  })

  test('the removed /watch slide is not in any deck', () => {
    const all = [...BASE_SLIDES, ...GATED_SLIDES].map((s) => s.path)
    expect(all).not.toContain('/watch')
  })

  test('non-holders see exactly the base deck: no vault, no first look', () => {
    const paths = visibleSlides(false).map((s) => s.path)
    expect(paths).toHaveLength(11)
    expect(paths).not.toContain('/vault')
    expect(paths).not.toContain('/firstlook')
    expect(paths).toContain('/quotes')
  })

  test('holders see the gated pair appended after the base deck, vault first', () => {
    const paths = visibleSlides(true).map((s) => s.path)
    expect(paths).toHaveLength(13)
    expect(paths.slice(0, 11)).toEqual(BASE_SLIDES.map((s) => s.path))
    expect(paths.slice(11)).toEqual(['/vault', '/firstlook'])
  })

  test('gated paths are exactly the gated slides', () => {
    expect(GATED_PATHS).toEqual(GATED_SLIDES.map((s) => s.path))
    for (const slide of GATED_SLIDES) expect(slide.gated).toBe(true)
  })

  test('names include FIRST LOOK for the gated preview slide', () => {
    expect(visibleSlides(true).map((s) => s.name)).toContain('FIRST LOOK')
    expect(visibleSlides(false).map((s) => s.name)).not.toContain('FIRST LOOK')
  })

  test('lens chrome colour is the brand maroon', () => {
    const lens = BASE_SLIDES.find((s) => s.path === '/lens')
    expect(lens?.hex).toBe('#3C0010')
    expect(lens?.shellClass).toBe('bg-ohnahji-burgundy')
  })
})
