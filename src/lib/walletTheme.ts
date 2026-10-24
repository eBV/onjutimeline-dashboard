import { darkTheme } from 'thirdweb/react'

// Brand theme for the thirdweb wallet modal (thirdweb v5 public theme API:
// darkTheme({ colors, fontFamily }) from 'thirdweb/react', verified against
// the installed 5.119.0 type definitions in node_modules).
//
// Why this exists: the modal used to render loud yellow buttons and a white
// sheet, not because of thirdweb's defaults (its light theme has no yellow)
// but because src/index.css painted every button[class*="tw-"] gold. That
// CSS rule is now scoped to the header connect/details buttons only, and
// the modal itself is themed here through the supported API, so no DOM
// internals are hacked.
//
// Values: primary buttons pink #FE517E with white text; sheet background
// maroon #3C0010; option rows a deeper maroon so they read as cards on the
// sheet; text white with a pale pink-grey secondary; outlines black to
// match the site's neo-brutalist chrome. fontFamily inherit pulls the
// site's Clarity City stack into the modal. danger and success keep
// thirdweb's defaults (they are status colors, not brand surfaces).
// The "Powered by thirdweb" attribution is untouched.
export const OHNAHJI_WALLET_THEME = darkTheme({
  colors: {
    modalBg: '#3C0010',
    modalOverlayBg: 'rgba(0, 0, 0, 0.7)',
    primaryText: '#FFFFFF',
    secondaryText: '#F0D9DE',
    accentText: '#FE517E',
    primaryButtonBg: '#FE517E',
    primaryButtonText: '#FFFFFF',
    accentButtonBg: '#FE517E',
    accentButtonText: '#FFFFFF',
    secondaryButtonBg: '#FE517E',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonHoverBg: '#E8456F',
    borderColor: '#FE517E',
    separatorLine: '#5A0F22',
    connectedButtonBg: '#FE517E',
    connectedButtonBgHover: '#E8456F',
    tooltipBg: '#000000',
    tooltipText: '#FFFFFF',
    inputAutofillBg: '#5A0F22',
    scrollbarBg: '#5A0F22',
    skeletonBg: '#5A0F22',
    tertiaryBg: 'rgba(90, 15, 34, 0.5)',
    secondaryIconColor: '#F0D9DE',
    secondaryIconHoverBg: '#5A0F22',
    secondaryIconHoverColor: '#FFFFFF',
    selectedTextBg: '#FE517E',
    selectedTextColor: '#FFFFFF',
  },
  fontFamily: 'inherit',
})
