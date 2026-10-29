import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import DesktopScroll, { DesktopSection } from '../components/DesktopScroll'

// framer-motion is mocked in component tests; DesktopScroll only calls
// progress.set, so a stub motion value is enough.
const stubProgress = () => ({ set: vi.fn(), get: () => 0 }) as any

const SECTIONS: DesktopSection[] = [
  { path: '/', name: 'ONJU', content: <div>Hero content</div> },
  { path: '/genesis', name: 'GENESIS', content: <div>Genesis content</div> },
  { path: '/faq', name: 'FAQ', content: <div>FAQ content</div> },
]

const renderNav = (currentSlide = 0, onSectionChange = () => {}) =>
  render(
    <DesktopScroll
      sections={SECTIONS}
      currentSlide={currentSlide}
      onSectionChange={onSectionChange}
      onScrollSection={() => {}}
      progress={stubProgress()}
      tint={stubProgress()}
      hexes={['#3C0010', '#FE517E', '#FE517E']}
      galleryOpen={false}
    />,
  )

describe('DesktopScroll side nav', () => {
  test('renders one side-nav button per section, in order', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    const buttons = nav.querySelectorAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveAttribute('aria-label', 'Go to slide ONJU')
    expect(buttons[1]).toHaveAttribute('aria-label', 'Go to slide GENESIS')
    expect(buttons[2]).toHaveAttribute('aria-label', 'Go to slide FAQ')
  })

  test('only the current section carries aria-current', () => {
    renderNav(1)
    expect(screen.getByRole('button', { name: /GENESIS/ })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: /ONJU/ })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: /FAQ/ })).not.toHaveAttribute('aria-current')
  })

  test('clicking a side-nav entry reports its index', async () => {
    const onSectionChange = vi.fn()
    renderNav(0, onSectionChange)
    await userEvent.click(screen.getByRole('button', { name: /FAQ/ }))
    expect(onSectionChange).toHaveBeenCalledWith(2)
  })

  test('sections render their content, gated and parked slides absent when not passed', () => {
    renderNav()
    expect(screen.getByText('Hero content')).toBeInTheDocument()
    expect(screen.getByText('FAQ content')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /VAULT/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ABOUT/i })).not.toBeInTheDocument()
  })

  test('the bar is the dock rotated, not the old black full-name rail', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    // Gold pill, fixed to the left edge: the dock's own treatment.
    const pill = nav.querySelector('[role="navigation"]')
    expect(pill?.className).toContain('bg-ohnahji-gold')
    expect(pill?.className).toContain('border-ohnahji-black')
    expect(nav.className).toContain('fixed')
    // No black rail: the nav itself is not a wide black panel.
    expect(nav.className).not.toContain('w-60')
    expect(nav.className).not.toContain('bg-ohnahji-black')
  })

  test('only the active section gets a horizontal label that reads normally', () => {
    const { container } = renderNav(1)
    expect(container.querySelectorAll('.\\[writing-mode\\:vertical-rl\\]')).toHaveLength(0)
    const pill = screen.getByRole('button', { name: /GENESIS/i }).querySelector('span[aria-hidden="true"]')
    expect(pill).not.toBeNull()
    expect(pill).toHaveTextContent('GENESIS')
    expect(pill?.className).toContain('left-full')
    expect(pill?.className).not.toContain('vertical-rl')
  })

  test('the hero section is exempt from the nav left pad; other sections keep it', () => {
    const { container } = renderNav()
    const heroPad = container.querySelector('section[data-path="/"] > div')
    const genesisPad = container.querySelector('section[data-path="/genesis"] > div')
    expect(heroPad?.className).toContain('xl:px-16')
    expect(heroPad?.className).not.toContain('xl:pl-48')
    expect(genesisPad?.className).toContain('xl:pl-48')
  })

  test('the hero section centers its content vertically; other sections flow from the top', () => {
    const { container } = renderNav()
    const heroPad = container.querySelector('section[data-path="/"] > div')
    const genesisPad = container.querySelector('section[data-path="/genesis"] > div')
    expect(heroPad?.className).toContain('justify-center')
    expect(genesisPad?.className).not.toContain('justify-center')
  })

  test('every section carries the same vertical breathing room', () => {
    const { container } = renderNav()
    const sections = container.querySelectorAll('section[data-path]')
    expect(sections.length).toBeGreaterThan(1)
    sections.forEach((section) => {
      expect(section.className).toContain('py-24')
    })
  })

  test('hovering widens the bar itself into a tray with a label next to every dot; no separate panel', async () => {
    renderNav(0)
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    const pill = nav.querySelector('[role="navigation"]')
    // Collapsed: exactly one label, the active section's standalone pill.
    expect(nav.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(1)
    await userEvent.hover(nav)
    // Expanded: one tray label per section, inside the gold pill, and
    // no separate menu panel anywhere.
    expect(screen.queryByLabelText('Site menu')).not.toBeInTheDocument()
    const trayLabels = nav.querySelectorAll('span[aria-hidden="true"]')
    expect(trayLabels).toHaveLength(3)
    expect(trayLabels[0]).toHaveTextContent('ONJU')
    expect(trayLabels[1]).toHaveTextContent('GENESIS')
    expect(trayLabels[2]).toHaveTextContent('FAQ')
    expect(pill?.className).toContain('overflow-hidden')
    // The active row's tray label is highlighted on top of the shared
    // black pill and gold text treatment.
    expect(trayLabels[0].className).toContain('ring-ohnahji-white')
  })

  test('tray container uses the regular rounded-2xl corners, not a pill, in both states', async () => {
    renderNav(0)
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    const pill = nav.querySelector('[role="navigation"]')
    expect(pill?.className).toContain('rounded-2xl')
    expect(pill?.className).not.toContain('rounded-full')
    await userEvent.hover(nav)
    expect(pill?.className).toContain('rounded-2xl')
    expect(pill?.className).not.toContain('rounded-full')
  })

  test('a tray label click navigates', async () => {
    const onSectionChange = vi.fn()
    renderNav(0, onSectionChange)
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    await userEvent.hover(nav)
    await userEvent.click(screen.getByRole('button', { name: /FAQ/ }))
    expect(onSectionChange).toHaveBeenCalledWith(2)
  })

  test('hover-out collapses the tray back to the single active label', async () => {
    renderNav(1)
    const navEl = screen.getByRole('navigation', { name: /site sections/i })
    await userEvent.hover(navEl)
    expect(navEl.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3)
    await userEvent.unhover(navEl)
    const labels = navEl.querySelectorAll('span[aria-hidden="true"]')
    expect(labels).toHaveLength(1)
    expect(labels[0]).toHaveTextContent('GENESIS')
  })
})
