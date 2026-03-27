import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import NavigationDots from '../components/NavigationDots'

// framer-motion needs DOM APIs that jsdom doesn't fully implement —
// mock only the pieces NavigationDots doesn't use so it stays stable.
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
}))

describe('NavigationDots', () => {
  const SLIDE_NAMES = ['ONJU', 'GENESIS', 'MINT', 'HBCU', 'ART', 'LIVE', 'SOCIALS']

  test('renders one button per slide', () => {
    render(<NavigationDots totalSlides={7} currentSlide={0} onSlideChange={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(7)
  })

  test('every button has an accessible label matching a slide name', () => {
    render(<NavigationDots totalSlides={7} currentSlide={0} onSlideChange={() => {}} />)
    for (const name of SLIDE_NAMES) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument()
    }
  })

  test('active slide button has aria-current="step"', () => {
    render(<NavigationDots totalSlides={7} currentSlide={2} onSlideChange={() => {}} />)
    expect(screen.getByRole('button', { name: /MINT/i })).toHaveAttribute('aria-current', 'step')
  })

  test('inactive slide buttons do not have aria-current', () => {
    render(<NavigationDots totalSlides={7} currentSlide={0} onSlideChange={() => {}} />)
    expect(screen.getByRole('button', { name: /GENESIS/i })).not.toHaveAttribute('aria-current')
  })

  test('calls onSlideChange with the correct index', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<NavigationDots totalSlides={7} currentSlide={0} onSlideChange={handleChange} />)
    await user.click(screen.getByRole('button', { name: /GENESIS/i }))
    expect(handleChange).toHaveBeenCalledOnce()
    expect(handleChange).toHaveBeenCalledWith(1)
  })

  test('container has navigation role and label', () => {
    render(<NavigationDots totalSlides={7} currentSlide={0} onSlideChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: /timeline navigation/i })).toBeInTheDocument()
  })
})
