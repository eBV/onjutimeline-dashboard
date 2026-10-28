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
})
