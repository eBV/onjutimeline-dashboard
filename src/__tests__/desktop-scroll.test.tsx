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

const renderRail = (currentSlide = 0) =>
  render(
    <DesktopScroll
      sections={SECTIONS}
      currentSlide={currentSlide}
      onSectionChange={() => {}}
      onScrollSection={() => {}}
      progress={stubProgress()}
      tint={stubProgress()}
      hexes={['#3C0010', '#FE517E', '#FE517E']}
      galleryOpen={false}
    />,
  )

describe('DesktopScroll rail', () => {
  test('renders one rail button per section, in order', () => {
    renderRail()
    const nav = screen.getByRole('navigation', { name: /site sections/i })
    const buttons = nav.querySelectorAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveTextContent('ONJU')
    expect(buttons[1]).toHaveTextContent('GENESIS')
    expect(buttons[2]).toHaveTextContent('FAQ')
  })

  test('only the current section carries aria-current', () => {
    renderRail(1)
    expect(screen.getByRole('button', { name: 'GENESIS' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'ONJU' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'FAQ' })).not.toHaveAttribute('aria-current')
  })

  test('clicking a rail entry reports its index', async () => {
    const onSectionChange = vi.fn()
    render(
      <DesktopScroll
        sections={SECTIONS}
        currentSlide={0}
        onSectionChange={onSectionChange}
        onScrollSection={() => {}}
        progress={stubProgress()}
        tint={stubProgress()}
        hexes={['#3C0010', '#FE517E', '#FE517E']}
        galleryOpen={false}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'FAQ' }))
    expect(onSectionChange).toHaveBeenCalledWith(2)
  })

  test('sections render their content, gated and parked slides absent when not passed', () => {
    renderRail()
    expect(screen.getByText('Hero content')).toBeInTheDocument()
    expect(screen.getByText('FAQ content')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /VAULT/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ABOUT/i })).not.toBeInTheDocument()
  })
})
