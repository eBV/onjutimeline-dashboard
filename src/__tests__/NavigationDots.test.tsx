import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import NavigationDots from '../components/NavigationDots'

// framer-motion needs DOM APIs that jsdom doesn't fully implement —
// mock only the pieces NavigationDots doesn't use so it stays stable.
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
}))

// Must match src/lib/deck.ts: base deck for everyone, gated pair appended
// for proven OG holders.
const BASE_NAMES = ['ONJU', 'STORY', 'GENESIS', 'MINT', 'HBCU', 'ART', 'MERCH', 'LIVE', 'LENS', 'SOCIALS']
const HOLDER_NAMES = [...BASE_NAMES, 'VAULT', 'FIRST LOOK']

const renderDots = (names: string[], currentSlide = 0) =>
  render(
    <NavigationDots
      totalSlides={names.length}
      slideNames={names}
      isSocials={names[currentSlide] === 'SOCIALS'}
      currentSlide={currentSlide}
      onSlideChange={() => {}}
    />,
  )

describe('NavigationDots', () => {
  test('renders one button per visible slide (base deck, no holder slides)', () => {
    renderDots(BASE_NAMES)
    expect(screen.getAllByRole('button')).toHaveLength(10)
  })

  test('base deck has no VAULT or FIRST LOOK buttons', () => {
    renderDots(BASE_NAMES)
    expect(screen.queryByRole('button', { name: /VAULT/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /FIRST LOOK/i })).not.toBeInTheDocument()
  })

  test('holder deck renders 12 buttons including VAULT and FIRST LOOK', () => {
    renderDots(HOLDER_NAMES)
    expect(screen.getAllByRole('button')).toHaveLength(12)
    expect(screen.getByRole('button', { name: /VAULT/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /FIRST LOOK/i })).toBeInTheDocument()
  })

  test('every button has an accessible label matching a slide name', () => {
    renderDots(HOLDER_NAMES)
    for (const name of HOLDER_NAMES) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument()
    }
  })

  test('active slide button has aria-current="step"', () => {
    renderDots(BASE_NAMES, 3)
    expect(screen.getByRole('button', { name: /MINT/i })).toHaveAttribute('aria-current', 'step')
  })

  test('inactive slide buttons do not have aria-current', () => {
    renderDots(BASE_NAMES, 0)
    expect(screen.getByRole('button', { name: /GENESIS/i })).not.toHaveAttribute('aria-current')
  })

  test('calls onSlideChange with the correct index', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <NavigationDots
        totalSlides={BASE_NAMES.length}
        slideNames={BASE_NAMES}
        isSocials={false}
        currentSlide={0}
        onSlideChange={handleChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: /GENESIS/i }))
    expect(handleChange).toHaveBeenCalledOnce()
    expect(handleChange).toHaveBeenCalledWith(2)
  })

  test('container has navigation role and label', () => {
    renderDots(BASE_NAMES)
    expect(screen.getByRole('navigation', { name: /timeline navigation/i })).toBeInTheDocument()
  })
})

// Nameplate tracking: the label's center must equal the active dot's center.
// jsdom reports zero rects, so layout is mocked at the prototype level and
// dispatched by element role: the aria-hidden label, the dot buttons (by
// their aria-label), and the relative wrapper.
describe('nameplate dot tracking', () => {
  const NAMES = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE']
  const rect = (left: number, width: number) =>
    ({
      left,
      top: 0,
      right: left + width,
      bottom: 20,
      width,
      height: 20,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
  let wrapLeft = 100
  const orig = Element.prototype.getBoundingClientRect
  const origOffsetDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')

  beforeEach(() => {
    wrapLeft = 100
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this.getAttribute('aria-hidden') === 'true') return rect(0, 60)
      const aria = this.getAttribute('aria-label')
      if (aria?.startsWith('Go to slide ')) {
        const idx = NAMES.indexOf(aria.replace('Go to slide ', ''))
        return rect(wrapLeft + 16 + idx * 26, 16)
      }
      if (this.className?.includes('relative')) return rect(wrapLeft, 300)
      return orig.call(this)
    }
    // The component reads the label width from offsetWidth (layout width,
    // transform-independent); jsdom reports 0 for it, so mock it by role
    // alongside the rect mock.
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: Element) {
        if (this.getAttribute('aria-hidden') === 'true') return 60
        if (this.getAttribute('aria-label')?.startsWith('Go to slide ')) return 16
        if (this.className?.includes('relative')) return 300
        return 0
      },
    })
  })

  afterEach(() => {
    Element.prototype.getBoundingClientRect = orig
    if (origOffsetDesc) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', origOffsetDesc)
  })

  test('label centers on the active dot, first and middle slides', () => {
    const { rerender } = render(
      <NavigationDots totalSlides={NAMES.length} slideNames={NAMES} isSocials={false} currentSlide={0} onSlideChange={() => {}} />,
    )
    // Dot 0 center relative to the wrapper: 16 (padding) + 8 (half dot).
    expect(screen.getByText('AAA')).toHaveStyle({ left: '24px' })
    rerender(
      <NavigationDots totalSlides={NAMES.length} slideNames={NAMES} isSocials={false} currentSlide={2} onSlideChange={() => {}} />,
    )
    // Dot 2 center: 16 + 2 * 26 + 8 = 76.
    expect(screen.getByText('CCC')).toHaveStyle({ left: '76px' })
  })

  test('label clamps to the viewport instead of clipping on an edge dot', () => {
    wrapLeft = 900
    const { rerender } = render(
      <NavigationDots totalSlides={NAMES.length} slideNames={NAMES} isSocials={false} currentSlide={0} onSlideChange={() => {}} />,
    )
    // Dot 0 center is still 24 relative to the wrapper, inside the viewport.
    expect(screen.getByText('AAA')).toHaveStyle({ left: '24px' })
    rerender(
      <NavigationDots totalSlides={NAMES.length} slideNames={NAMES} isSocials={false} currentSlide={4} onSlideChange={() => {}} />,
    )
    // Dot 4 center would be 128, but the viewport cap is
    // 1024 - 2 - 30 (half label) - 900 (wrapper left) = 92.
    expect(screen.getByText('EEE')).toHaveStyle({ left: '92px' })
  })
})

// Anchor positioning path: on browsers that support CSS anchor
// positioning, the label must NOT get a JS inline left (an inline left
// would beat the anchor rule), so the anchor classes own placement.
describe('nameplate anchor positioning', () => {
  test('anchor-capable browsers skip the JS inline left', async () => {
    vi.stubGlobal('CSS', { supports: () => true })
    try {
      vi.resetModules()
      const { default: AnchorDots } = await import('../components/NavigationDots')
      const NAMES = ['AAA', 'BBB', 'CCC']
      render(
        <AnchorDots totalSlides={NAMES.length} slideNames={NAMES} isSocials={false} currentSlide={1} onSlideChange={() => {}} />,
      )
      const label = screen.getByText('BBB')
      expect(label.style.left).toBe('')
      expect(label.className).toContain('position-anchor')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
