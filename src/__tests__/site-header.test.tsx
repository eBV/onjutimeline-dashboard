import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('thirdweb/react', () => ({
  ConnectButton: () => <button>CONNECT</button>,
  darkTheme: () => ({}),
  useActiveAccount: () => undefined,
  useConnectModal: () => ({ connect: () => {} }),
  useWalletDetailsModal: () => ({ open: () => {} }),
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
  test('the home button is the ji logo mark that navigates home', async () => {
    const onHome = vi.fn()
    renderHeader(onHome)
    const home = screen.getByRole('button', { name: /go home/i })
    expect(home).not.toHaveTextContent('HOME')
    const logo = home.querySelector('img')
    expect(logo).not.toBeNull()
    expect(logo?.getAttribute('src')).toContain('/ji.png')
    await userEvent.click(home)
    expect(onHome).toHaveBeenCalled()
  })

  test('the MENU button is hidden on desktop, where the left bar menu replaces it', () => {
    renderHeader()
    const menu = screen.getByRole('button', { name: /open the slide index/i })
    expect(menu.className).toContain('xl:hidden')
  })

  test('on mobile the wallet control is just an icon with MENU at the far right', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia
    try {
      renderHeader()
      const walletIcon = screen.getByRole('button', { name: /connect wallet/i })
      expect(walletIcon).toBeInTheDocument()
      const menu = screen.getByRole('button', { name: /open the slide index/i })
      expect(menu).toBeInTheDocument()
      const headerButtons = [...document.querySelectorAll('header button, div.fixed.top-0 button')]
      const walletIndex = headerButtons.indexOf(walletIcon)
      const menuIndex = headerButtons.indexOf(menu)
      expect(walletIndex).toBeGreaterThan(-1)
      expect(menuIndex).toBeGreaterThan(walletIndex)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
