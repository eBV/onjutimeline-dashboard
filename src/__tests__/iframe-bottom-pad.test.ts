import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Pins the iframe-slide bottom clearance (2026-10-27). Measured before
// the fix, at max outer scroll: the Exchangent frame bottom sat 24px
// below the dock top at 390px and 46px below it at desktop; the First
// Look campus frame bottom sat 46px below the dock top at desktop
// (mobile already cleared by 126px). The shared scroller spacer is
// mobile-only, so desktop has no equivalent room. The fix is a real
// trailing flex item on each slide (160px, all widths), because Chrome
// ignores trailing padding for scrollable overflow on column flex
// scrollers; if either spacer moves, the end-of-scroll QA must be
// re-run at 390px and desktop before shipping.
const here = dirname(fileURLToPath(import.meta.url))
const read = (p: string) => readFileSync(join(here, '..', p), 'utf8')

describe('iframe slide bottom clearance', () => {
  it('exchangent slide ends with a 160px trailing spacer', () => {
    const src = read('features/exchangent/SlideExchangent.tsx')
    expect(src).toContain('className="flex-none h-40"')
    expect(src).toContain('Trailing room (2026-10-27)')
  })

  it('first look slide ends with a 160px trailing spacer', () => {
    const src = read('features/firstlook/SlideFirstLook.tsx')
    expect(src).toContain('className="flex-none h-40"')
    expect(src).toContain('Trailing room (2026-10-27)')
  })

  it('exchangent iframe itself is unchanged (room lives on the slide layer)', () => {
    const src = read('features/exchangent/SlideExchangent.tsx')
    expect(src).toContain("const EXCHANGENT_URL = '/exchangent/index.html'")
    expect(src).toContain('className="w-full h-full min-h-[70dvh] block"')
  })
})
