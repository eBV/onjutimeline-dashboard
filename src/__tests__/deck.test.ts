import { BASE_SLIDES, GATED_SLIDES, GATED_PATHS, visibleSlides } from '../lib/deck'

describe('deck composition', () => {
  test('base deck is the 10 public slides in order', () => {
    expect(BASE_SLIDES.map((s) => s.path)).toEqual([
      '/', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/socials',
    ])
  })

  test('the removed /watch slide is not in any deck', () => {
    const all = [...BASE_SLIDES, ...GATED_SLIDES].map((s) => s.path)
    expect(all).not.toContain('/watch')
  })

  test('non-holders see exactly the base deck: no vault, no first look', () => {
    const paths = visibleSlides(false).map((s) => s.path)
    expect(paths).toHaveLength(10)
    expect(paths).not.toContain('/vault')
    expect(paths).not.toContain('/firstlook')
  })

  test('holders see the gated pair appended after the base deck, vault first', () => {
    const paths = visibleSlides(true).map((s) => s.path)
    expect(paths).toHaveLength(12)
    expect(paths.slice(0, 10)).toEqual(BASE_SLIDES.map((s) => s.path))
    expect(paths.slice(10)).toEqual(['/vault', '/firstlook'])
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
