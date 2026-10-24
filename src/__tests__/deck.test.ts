import { BASE_SLIDES, GATED_SLIDES, GATED_PATHS, ADMIN_SLIDE, visibleSlides } from '../lib/deck'

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

describe('site-config deck filtering', () => {
  test('two hidden slides drop out of the deck for every visitor', () => {
    const paths = visibleSlides(false, {
      slideConfig: { '/story': { visible: false }, '/merch': { visible: false } },
    }).map((s) => s.path)
    expect(paths).toHaveLength(9)
    expect(paths).not.toContain('/story')
    expect(paths).not.toContain('/merch')
    expect(paths[0]).toBe('/')
  })

  test('hidden gated slides drop out for holders too', () => {
    const paths = visibleSlides(true, {
      slideConfig: { '/vault': { visible: false } },
    }).map((s) => s.path)
    expect(paths).not.toContain('/vault')
    expect(paths).toContain('/firstlook')
  })

  test('the hero slide can never be hidden by config', () => {
    const paths = visibleSlides(false, {
      slideConfig: { '/': { visible: false } },
    }).map((s) => s.path)
    expect(paths[0]).toBe('/')
    expect(paths).toHaveLength(11)
  })

  test('a hex override replaces the slide hex, which is what the tint stops read', () => {
    const slides = visibleSlides(false, {
      slideConfig: { '/story': { hex: '#123456' } },
    })
    const hexes = slides.map((s) => s.hex)
    expect(slides.find((s) => s.path === '/story')?.hex).toBe('#123456')
    expect(hexes[1]).toBe('#123456')
    // Untouched slides keep their deck defaults.
    expect(slides.find((s) => s.path === '/quotes')?.hex).toBe('#FE517E')
  })
})

describe('admin slide', () => {
  test('admin slide meta is owner-only and named ADMIN', () => {
    expect(ADMIN_SLIDE.path).toBe('/admin')
    expect(ADMIN_SLIDE.name).toBe('ADMIN')
    expect(ADMIN_SLIDE.adminOnly).toBe(true)
  })

  test('no admin slide without the admin flag', () => {
    expect(visibleSlides(false).map((s) => s.path)).not.toContain('/admin')
    expect(visibleSlides(true).map((s) => s.path)).not.toContain('/admin')
  })

  test('admin appends at the very end, after the gated pair', () => {
    const paths = visibleSlides(true, { isAdmin: true }).map((s) => s.path)
    expect(paths).toHaveLength(14)
    expect(paths.slice(11)).toEqual(['/vault', '/firstlook', '/admin'])
  })

  test('admin without holder state still gets the tab after the base deck', () => {
    const paths = visibleSlides(false, { isAdmin: true }).map((s) => s.path)
    expect(paths).toHaveLength(12)
    expect(paths[11]).toBe('/admin')
  })

  test('the admin slide is not part of the base or gated decks', () => {
    expect(BASE_SLIDES.map((s) => s.path)).not.toContain('/admin')
    expect(GATED_SLIDES.map((s) => s.path)).not.toContain('/admin')
  })
})
