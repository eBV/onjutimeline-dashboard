import { OHNAHJI_WALLET_THEME } from '../lib/walletTheme'

describe('wallet connect sheet theme (wave 3)', () => {
  test('black sheet, white borders, pink lettering', () => {
    const colors = OHNAHJI_WALLET_THEME.colors
    expect(colors.modalBg).toBe('#000000')
    expect(colors.borderColor).toBe('#FFFFFF')
    expect(colors.separatorLine).toBe('#FFFFFF')
    expect(colors.primaryText).toBe('#FE517E')
    expect(colors.accentText).toBe('#FE517E')
    // Buttons stay black with pink text so the lettering reads pink on
    // black instead of vanishing into a pink fill.
    expect(colors.primaryButtonBg).toBe('#000000')
    expect(colors.primaryButtonText).toBe('#FE517E')
    expect(colors.accentButtonBg).toBe('#000000')
    expect(colors.accentButtonText).toBe('#FE517E')
  })
})
