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
