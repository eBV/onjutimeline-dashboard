import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('thirdweb/react', () => ({
  ConnectButton: () => <button>CONNECT</button>,
  darkTheme: () => ({}),
}))

import SiteHeader from '../components/SiteHeader'

const renderHeader = (onHome = () => {}) =>
  render(
    <SiteHeader
      slideNames={['ONJU', 'FAQ']}
      slidePaths={['/', '/faq']}
      currentSlide={0}
      onSlideChange={() => {}}
      onHome={onHome}
      onMint={() => {}}
      showMint
      isGalleryOpen={false}
      client={{}}
      chain={{}}
    />,
  )

describe('SiteHeader home and menu', () => {
  test('the home button is a pink HOME button that navigates home', async () => {
    const onHome = vi.fn()
    renderHeader(onHome)
    const home = screen.getByRole('button', { name: /go home/i })
    expect(home).toHaveTextContent('HOME')
    expect(home.className).toContain('bg-ohnahji-pink')
    expect(home.className).toContain('text-ohnahji-white')
    await userEvent.click(home)
    expect(onHome).toHaveBeenCalled()
  })

  test('the MENU button is hidden on desktop, where the left bar menu replaces it', () => {
    renderHeader()
    const menu = screen.getByRole('button', { name: /open the slide index/i })
    expect(menu.className).toContain('xl:hidden')
  })
})
