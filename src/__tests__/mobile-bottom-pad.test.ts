import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Pins the mobile bottom-clearance mechanism (2026-10-24). The
// .slide-scroller padding-bottom values are NOT the clearance mechanism:
// on a column flex scroller Chrome ignores trailing padding for
// scrollable overflow (measured: +284px of padding left scrollHeight
// unchanged), so the real clearance is the trailing ::after flex item
// below. If either value moves, the Genesis end-of-slide centering QA
// must be re-run at 390px and 430px before shipping.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.css'), 'utf8')

describe('mobile bottom clearance', () => {
  it('keeps the existing slide-scroller padding-bottom values untouched', () => {
    expect(css).toContain('scroll-padding-bottom: calc(8rem + env(safe-area-inset-bottom));')
    expect(css).toContain('padding-bottom: calc(8rem + env(safe-area-inset-bottom));')
    expect(css).toContain('scroll-padding-bottom: calc(8rem + 88px);')
    expect(css).toContain('padding-bottom: calc(8rem + 88px);')
  })

  it('adds a mobile-only trailing spacer to the slide scroller', () => {
    const mediaIdx = css.indexOf('@media (max-width: 767px)')
    expect(mediaIdx).toBeGreaterThan(-1)
    const block = css.slice(mediaIdx)
    expect(block).toContain('.slide-scroller::after')
    expect(block).toContain('flex: none;')
    expect(block).toContain('height: 400px;')
    expect(block).toContain('height: calc(845px - 50dvh);')
  })
})

// Large-overflow slides need their own in-flow trailing room: the
// scroller spacer only floors maxScroll on short slides and is inert
// once content already overflows past it (measured: Quotes maxScroll
// stayed 9250 for spacer heights 423, 800, and 1200). Each value below
// is mobile-only (md: resets it) and was sized from the 390px QA
// deficit on its slide: Quotes 124, Socials 17, Live 132, Merch 112,
// Art 140, Muralith 118, each plus 60-100px of comfort. Socials uses
// wrapper padding, not a margin: the line's own margin collapsed out
// of its block wrapper, and 96px of padding only reached a 1252px
// content extent, still under the scroller's 1267px flex floor; 224px
// of padding puts the extent at 1380px and moves scrollHeight.
const feature = (rel: string) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'features', rel), 'utf8')

describe('large-overflow slide trailing margins', () => {
  it('keeps a mobile-only trailing margin on each failing slide final block', () => {
    expect(feature('quotes/SlideQuotes.tsx')).toContain('mb-56 md:mb-4')
    expect(feature('community/Slide6Socials.tsx')).toContain('pb-56 md:pb-0')
    expect(feature('community/Slide5Livestreams.tsx')).toContain('mb-56 md:mb-0')
    expect(feature('merch/SlideMerch.tsx')).toContain('mb-48 md:mb-0')
    expect(feature('gallery/Slide4Collections.tsx')).toContain('mb-56 md:mb-0')
    expect(feature('muralith/SlideMuralith.tsx')).toContain('mb-48 md:mb-0')
  })
})
