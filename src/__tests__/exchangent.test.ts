import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE_SLIDES, visibleSlides } from '../lib/deck'
// @ts-expect-error plain JS API modules have no type declarations
import { mergeSiteConfig as mergeServer } from '../../api/_config.js'
import { mergeSiteConfig as mergeClient, DEFAULT_SITE_CONFIG } from '../lib/siteConfig'

const NOBODY = { isConnected: false, isHolder: false }
const CONNECTED = { isConnected: true, isHolder: false }
const HOLDER = { isConnected: true, isHolder: true }

// The live KV document as it stands before this change: 14 slides and
// a 14-path order. Both merges must keep it working while adding the
// new slide at its defaults, because the stored order is no longer a
// permutation of the 15 known paths and must fall back to the default.
const LEGACY_KV_DOC = {
  version: 2,
  order: ['/', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/quotes', '/socials', '/muralith', '/vault', '/firstlook'],
  fontWeight: null,
  slides: {
    '/story': { visible: false },
    '/quotes': { hex: '#111111' },
  },
  features: { mintPill: true, quotesVoting: true, twitchVodRows: true, antiPhishingLine: true },
}

describe('exchangent slide gating', () => {
  test('exchangent sits in the base deck after muralith, gated, burgundy', () => {
    const paths = BASE_SLIDES.map((s) => s.path)
    expect(paths.indexOf('/exchangent')).toBe(paths.indexOf('/muralith') + 1)
    expect(paths[paths.length - 1]).toBe('/exchangent')
    const holderPaths = visibleSlides(HOLDER).map((s) => s.path)
    expect(holderPaths.indexOf('/exchangent')).toBe(holderPaths.indexOf('/vault') - 1)
    const slide = BASE_SLIDES.find((s) => s.path === '/exchangent')
    expect(slide?.name).toBe('EXCHANGENT')
    expect(slide?.gated).toBe(true)
    expect(slide?.hex).toBe('#3C0010')
  })

  test('exchangent is hidden for unconnected and connected non-holders, shown for holders', () => {
    expect(visibleSlides(NOBODY).map((s) => s.path)).not.toContain('/exchangent')
    expect(visibleSlides(CONNECTED).map((s) => s.path)).not.toContain('/exchangent')
    expect(visibleSlides(HOLDER).map((s) => s.path)).toContain('/exchangent')
  })

  test('the admin panel can open exchangent to the public or hide it', () => {
    expect(visibleSlides(NOBODY, { slideConfig: { '/exchangent': { gate: 'public' as const } } }).map((s) => s.path)).toContain('/exchangent')
    expect(visibleSlides(HOLDER, { slideConfig: { '/exchangent': { visible: false } } }).map((s) => s.path)).not.toContain('/exchangent')
  })

  test('no-override defaults gate exchangent to og with admin copy', () => {
    for (const merged of [mergeServer(null), mergeClient(null)]) {
      expect(merged.slides['/exchangent'].gate).toBe('og')
      expect(merged.slides['/exchangent'].visible).toBe(true)
      expect(merged.slides['/exchangent'].hex).toBe('#3C0010')
      expect(merged.slides['/exchangent'].copy.heading).toBe('The\nExchangent')
    }
    expect(DEFAULT_SITE_CONFIG.slides['/exchangent'].gate).toBe('og')
  })

  test('legacy 14-slide KV config still works and gains exchangent at og defaults', () => {
    for (const merged of [mergeServer(LEGACY_KV_DOC), mergeClient(LEGACY_KV_DOC)]) {
      expect(merged.order).toHaveLength(15)
      expect(merged.order.indexOf('/exchangent')).toBe(merged.order.indexOf('/muralith') + 1)
      expect(merged.slides['/exchangent'].gate).toBe('og')
      expect(merged.slides['/exchangent'].visible).toBe(true)
      // Stored overrides still apply around the new slide.
      expect(merged.slides['/story'].visible).toBe(false)
      expect(merged.slides['/quotes'].hex).toBe('#111111')
      const holderPaths = visibleSlides(HOLDER, { slideConfig: merged.slides, order: merged.order }).map((s) => s.path)
      expect(holderPaths).toContain('/exchangent')
      expect(holderPaths).not.toContain('/story')
      const nobodyPaths = visibleSlides(NOBODY, { slideConfig: merged.slides, order: merged.order }).map((s) => s.path)
      expect(nobodyPaths).not.toContain('/exchangent')
    }
  })
})

describe('vendored exchangent fileset', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'exchangent')
  const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

  test('every vendored file exists, including the three.js build as push-sized chunks', () => {
    // three.min.js (603KB) cannot ride the snapshot push route: a single
    // CLI argument is capped near 128KB. It ships as 9 byte slices of the
    // identical source, each a string-append chunk, plus a tiny exec
    // script that injects the concatenated source synchronously, in
    // document order, before OrbitControls. The original file is preserved
    // in the variant directory it was vendored from.
    const chunks = Array.from({ length: 9 }, (_, i) => `vendor/three-chunks/three.p${String(i).padStart(2, '0')}.js`)
    for (const rel of ['index.html', 'styles.css', 'timeline.css', 'app.js', 'extra.js', 'tohseno.js', 'agents.html', 'llms.txt', 'vendor/OrbitControls.js', 'vendor/three-chunks/three.exec.js', ...chunks]) {
      expect(existsSync(join(root, rel))).toBe(true)
    }
    let joined = ''
    for (const rel of chunks) {
      const m = read(rel).match(/^window\.__t3=\(window\.__t3\|\|''\)\+(.*);\n$/s)
      expect(m).not.toBeNull()
      joined += JSON.parse(m![1])
    }
    expect(joined.length).toBeGreaterThan(500000)
    expect(joined).toContain('THREE')
  })

  test('no links back to the live explainer project, the variant preview, or Google Fonts', () => {
    for (const rel of ['index.html', 'agents.html', 'llms.txt']) {
      const text = read(rel)
      expect(text).not.toContain('the-exchangent.vercel.app')
      expect(text).not.toContain('fonts.googleapis.com')
    }
  })

  test('no root-absolute asset refs remain; every page asset lives under /exchangent/', () => {
    for (const rel of ['index.html', 'agents.html']) {
      const text = read(rel)
      const refs = [...text.matchAll(/(?:src|href)="([^"]*)"/g)].map((m) => m[1])
      for (const ref of refs) {
        if (ref.startsWith('/') && !ref.startsWith('/exchangent/')) {
          throw new Error(`${rel} still references root-absolute ${ref}`)
        }
      }
      expect(text).toContain('/exchangent/styles.css')
    }
    expect(read('index.html')).toContain('/exchangent/vendor/three-chunks/three.p00.js')
    expect(read('index.html')).toContain('/exchangent/vendor/three-chunks/three.exec.js')
    expect(read('index.html')).toContain('/exchangent/app.js')
  })

  test('vendored scripts make no external requests', () => {
    for (const rel of ['app.js', 'extra.js', 'tohseno.js']) {
      expect(read(rel)).not.toContain('https://')
    }
  })

  test('vercel.json self-rewrites the exchangent dir before the SPA catch-all', () => {
    const vercel = JSON.parse(readFileSync(join(root, '..', '..', 'vercel.json'), 'utf8'))
    const sources = vercel.rewrites.map((r: { source: string }) => r.source)
    expect(sources).toContain('/exchangent/(.*)')
    expect(sources.indexOf('/exchangent/(.*)')).toBeLessThan(sources.indexOf('/(.*)'))
  })
})
