import { BASE_SLIDES, GATED_SLIDES, GATED_PATHS, ADMIN_SLIDE, visibleSlides, gateSatisfied } from '../lib/deck'

// Gate states: nobody (disconnected), connected-but-not-holder, holder.
const NOBODY = { isConnected: false, isHolder: false }
const CONNECTED = { isConnected: true, isHolder: false }
const HOLDER = { isConnected: true, isHolder: true }

describe('deck composition', () => {
  test('base deck is the 13 public slides plus gated exchangent, in order', () => {
    expect(BASE_SLIDES.map((s) => s.path)).toEqual([
      '/', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/quotes', '/socials', '/faq', '/muralith', '/exchangent',
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

  test('non-holders see exactly the public base deck: no vault, no first look, no exchangent', () => {
    const paths = visibleSlides(NOBODY).map((s) => s.path)
    expect(paths).toHaveLength(13)
    expect(paths).not.toContain('/vault')
    expect(paths).not.toContain('/firstlook')
    expect(paths).not.toContain('/exchangent')
    expect(paths).toContain('/quotes')
  })

  test('holders see the gated pair appended after the base deck, vault first', () => {
    const paths = visibleSlides(HOLDER).map((s) => s.path)
    expect(paths).toHaveLength(16)
    expect(paths.slice(0, 14)).toEqual(BASE_SLIDES.map((s) => s.path))
    expect(paths.slice(14)).toEqual(['/vault', '/firstlook'])
  })

  test('gated paths are exactly the gated slides', () => {
    expect(GATED_PATHS).toEqual(GATED_SLIDES.map((s) => s.path))
    for (const slide of GATED_SLIDES) expect(slide.gated).toBe(true)
  })

  test('names include FIRST LOOK for the gated preview slide', () => {
    expect(visibleSlides(HOLDER).map((s) => s.name)).toContain('FIRST LOOK')
    expect(visibleSlides(NOBODY).map((s) => s.name)).not.toContain('FIRST LOOK')
  })

  test('lens chrome colour is the brand maroon', () => {
    const lens = BASE_SLIDES.find((s) => s.path === '/lens')
    expect(lens?.hex).toBe('#3C0010')
    expect(lens?.shellClass).toBe('bg-ohnahji-burgundy')
  })
})

describe('gate resolution matrix', () => {
  test('public passes for everyone, wallet needs a connection, og needs a holder', () => {
    expect(gateSatisfied('public', NOBODY)).toBe(true)
    expect(gateSatisfied('public', CONNECTED)).toBe(true)
    expect(gateSatisfied('public', HOLDER)).toBe(true)
    expect(gateSatisfied('wallet', NOBODY)).toBe(false)
    expect(gateSatisfied('wallet', CONNECTED)).toBe(true)
    expect(gateSatisfied('wallet', HOLDER)).toBe(true)
    expect(gateSatisfied('og', NOBODY)).toBe(false)
    expect(gateSatisfied('og', CONNECTED)).toBe(false)
    expect(gateSatisfied('og', HOLDER)).toBe(true)
  })

  test('a wallet-gated public slide appears on connect and vanishes on disconnect', () => {
    const cfg = { slideConfig: { '/art': { gate: 'og' as const } } }
    expect(visibleSlides(NOBODY, cfg).map((s) => s.path)).not.toContain('/art')
    expect(visibleSlides(CONNECTED, cfg).map((s) => s.path)).not.toContain('/art')
    expect(visibleSlides(HOLDER, cfg).map((s) => s.path)).toContain('/art')
    const walletCfg = { slideConfig: { '/art': { gate: 'wallet' as const } } }
    expect(visibleSlides(NOBODY, walletCfg).map((s) => s.path)).not.toContain('/art')
    expect(visibleSlides(CONNECTED, walletCfg).map((s) => s.path)).toContain('/art')
  })

  test('the gated pair can be opened to the public by config, and re-gated', () => {
    const open = { slideConfig: { '/vault': { gate: 'public' as const } } }
    expect(visibleSlides(NOBODY, open).map((s) => s.path)).toContain('/vault')
    const walletOnly = { slideConfig: { '/vault': { gate: 'wallet' as const } } }
    expect(visibleSlides(NOBODY, walletOnly).map((s) => s.path)).not.toContain('/vault')
    expect(visibleSlides(CONNECTED, walletOnly).map((s) => s.path)).toContain('/vault')
  })

  test('a hidden gated slide stays hidden even for a satisfying visitor', () => {
    const paths = visibleSlides(HOLDER, {
      slideConfig: { '/vault': { visible: false, gate: 'public' as const } },
    }).map((s) => s.path)
    expect(paths).not.toContain('/vault')
  })
})

describe('site-config deck filtering', () => {
  test('two hidden slides drop out of the deck for every visitor', () => {
    const paths = visibleSlides(NOBODY, {
      slideConfig: { '/story': { visible: false }, '/merch': { visible: false } },
    }).map((s) => s.path)
    expect(paths).toHaveLength(11)
    expect(paths).not.toContain('/story')
    expect(paths).not.toContain('/merch')
    expect(paths[0]).toBe('/')
  })

  test('hidden gated slides drop out for holders too', () => {
    const paths = visibleSlides(HOLDER, {
      slideConfig: { '/vault': { visible: false } },
    }).map((s) => s.path)
    expect(paths).not.toContain('/vault')
    expect(paths).toContain('/firstlook')
  })

  test('the hero slide can never be hidden by config', () => {
    const paths = visibleSlides(NOBODY, {
      slideConfig: { '/': { visible: false } },
    }).map((s) => s.path)
    expect(paths[0]).toBe('/')
    expect(paths).toHaveLength(13)
  })

  test('a hex override replaces the slide hex, which is what the tint stops read', () => {
    const slides = visibleSlides(NOBODY, {
      slideConfig: { '/story': { hex: '#123456' } },
    })
    const hexes = slides.map((s) => s.hex)
    expect(slides.find((s) => s.path === '/story')?.hex).toBe('#123456')
    expect(hexes[1]).toBe('#123456')
    // Untouched slides keep their deck defaults.
    expect(slides.find((s) => s.path === '/quotes')?.hex).toBe('#FE517E')
  })
})

describe('tab order', () => {
  const all = [...BASE_SLIDES, ...GATED_SLIDES].map((s) => s.path)

  test('a stored order reorders the deck, hero pinned first', () => {
    const order = ['/', '/quotes', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/socials', '/faq', '/muralith', '/exchangent', '/vault', '/firstlook']
    const paths = visibleSlides(HOLDER, { order }).map((s) => s.path)
    expect(paths).toEqual(order)
  })

  test('order applies to visitors too, and admin still appends last', () => {
    const order = ['/', '/socials', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/quotes', '/faq', '/muralith', '/exchangent', '/vault', '/firstlook']
    const paths = visibleSlides(NOBODY, { order, isAdmin: true }).map((s) => s.path)
    expect(paths[0]).toBe('/')
    expect(paths[1]).toBe('/socials')
    expect(paths[paths.length - 1]).toBe('/admin')
  })

  test('an invalid order (missing path, duplicate, hero not first) falls back to deck order', () => {
    expect(visibleSlides(HOLDER, { order: ['/', '/story'] }).map((s) => s.path)).toEqual(all)
    expect(visibleSlides(HOLDER, { order: [...all.slice(1), all[0]] }).map((s) => s.path)).toEqual(all)
    const dup = [...all]
    dup[1] = dup[2]
    expect(visibleSlides(HOLDER, { order: dup }).map((s) => s.path)).toEqual(all)
  })
})

describe('font weight resolution', () => {
  test('per-slide weight wins over sitewide, sitewide wins over as-designed', () => {
    const slides = visibleSlides(NOBODY, {
      fontWeight: 300,
      slideConfig: { '/story': { weight: 800 }, '/art': { weight: null } },
    })
    expect(slides.find((s) => s.path === '/story')?.weight).toBe(800)
    expect(slides.find((s) => s.path === '/art')?.weight).toBe(300)
    expect(slides.find((s) => s.path === '/')?.weight).toBe(300)
  })

  test('no weight anywhere leaves the meta weightless (as designed)', () => {
    const slides = visibleSlides(NOBODY, {})
    expect(slides.every((s) => s.weight === undefined)).toBe(true)
  })
})

describe('admin slide', () => {
  test('admin slide meta is owner-only and named ADMIN', () => {
    expect(ADMIN_SLIDE.path).toBe('/admin')
    expect(ADMIN_SLIDE.name).toBe('ADMIN')
    expect(ADMIN_SLIDE.adminOnly).toBe(true)
  })

  test('no admin slide without the admin flag', () => {
    expect(visibleSlides(NOBODY).map((s) => s.path)).not.toContain('/admin')
    expect(visibleSlides(HOLDER).map((s) => s.path)).not.toContain('/admin')
  })

  test('admin appends at the very end, after the gated pair', () => {
    const paths = visibleSlides(HOLDER, { isAdmin: true }).map((s) => s.path)
    expect(paths).toHaveLength(17)
    expect(paths.slice(13)).toEqual(['/exchangent', '/vault', '/firstlook', '/admin'])
  })

  test('admin without holder state still gets the tab after the base deck', () => {
    const paths = visibleSlides(NOBODY, { isAdmin: true }).map((s) => s.path)
    expect(paths).toHaveLength(14)
    expect(paths[13]).toBe('/admin')
  })

  test('the admin slide is not part of the base or gated decks', () => {
    expect(BASE_SLIDES.map((s) => s.path)).not.toContain('/admin')
    expect(GATED_SLIDES.map((s) => s.path)).not.toContain('/admin')
  })
})
