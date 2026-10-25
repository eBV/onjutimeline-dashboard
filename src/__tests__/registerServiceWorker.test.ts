import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Regression test for the 2026-10-25 Android "cannot be installed"
// report: registration used to wait for the window load event, which
// left fresh tabs uninstallable until every eager subresource finished
// loading (and never installable if one hung). Registration must
// happen at once, guarded only by the production and API checks.
const SOURCE = readFileSync(
  join(process.cwd(), 'src/lib/registerServiceWorker.ts'),
  'utf8',
)

describe('registerServiceWorker', () => {
  it('registers /sw.js', () => {
    expect(SOURCE).toContain("navigator.serviceWorker.register('/sw.js')")
  })

  it('does not defer registration to the window load event', () => {
    expect(SOURCE).not.toContain("addEventListener('load'")
    expect(SOURCE).not.toContain('addEventListener("load"')
  })

  it('still guards on production builds and API presence', () => {
    expect(SOURCE).toContain('import.meta.env.PROD')
    expect(SOURCE).toContain("'serviceWorker' in navigator")
  })
})
