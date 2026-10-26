import { darkTheme } from 'thirdweb/react'

// Brand theme for the thirdweb wallet modal (thirdweb v5 public theme API:
// darkTheme({ colors, fontFamily }) from 'thirdweb/react', verified against
// the installed 5.119.0 sources. The API exposes colors only; there is no
// border-width token (thirdweb hardcodes the sheet border at 1px), so the
// thicker white sheet border lives in src/index.css as a scoped rule on
// thirdweb's own stable tw-modal classes, not on hashed internals.
//
// Wave 3 look: black sheet, white borders, pink lettering throughout.
// Buttons are black with pink text and white borders so the lettering
// stays pink and readable on black; danger and success keep thirdweb's
// defaults (they are status colors, not brand surfaces). The "Powered by
// thirdweb" attribution is untouched. fontFamily inherit pulls the site's
// Clarity City stack into the modal.
export const OHNAHJI_WALLET_THEME = darkTheme({
  colors: {
    modalBg: '#000000',
    modalOverlayBg: 'rgba(0, 0, 0, 0.7)',
    primaryText: '#FE517E',
    secondaryText: '#FF8FAB',
    accentText: '#FE517E',
    primaryButtonBg: '#000000',
    primaryButtonText: '#FE517E',
    accentButtonBg: '#000000',
    accentButtonText: '#FE517E',
    secondaryButtonBg: '#111111',
    secondaryButtonText: '#FE517E',
    secondaryButtonHoverBg: '#1A1A1A',
    borderColor: '#FFFFFF',
    separatorLine: '#FFFFFF',
    connectedButtonBg: '#000000',
    connectedButtonBgHover: '#1A1A1A',
    tooltipBg: '#000000',
    tooltipText: '#FE517E',
    inputAutofillBg: '#1A1A1A',
    scrollbarBg: '#333333',
    skeletonBg: '#1A1A1A',
    tertiaryBg: 'rgba(255, 255, 255, 0.06)',
    secondaryIconColor: '#FE517E',
    secondaryIconHoverBg: '#1A1A1A',
    secondaryIconHoverColor: '#FFFFFF',
    selectedTextBg: '#FE517E',
    selectedTextColor: '#000000',
  },
  fontFamily: 'inherit',
})
