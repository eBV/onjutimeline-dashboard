// Uniform dissolve tint: the colour the whole site background dissolves
// through as the user scrolls. The header and footer chrome already
// interpolated between slide colours; the slide panels used to paint
// their own solid colours, cutting hard at every boundary. Now the
// panels are transparent and this single interpolated value paints the
// full-viewport shell behind the content on both layouts, so the main
// page areas dissolve exactly like the chrome does.
//
// Interpolation is piecewise linear in RGB space, the same space
// framer-motion mixes hex colours in, so a value computed here matches
// the old chrome transform at every stop. At a stop the result is
// bit-exact; between stops it is the straight blend of the two
// neighbouring slide hexes. Stops are index fractions i/(n-1) on both
// layouts: on the mobile deck, stop i is slide i fully in view; on the
// desktop scroller, stop i is the same fraction of total page scroll.
// One rule, no per-layout measurement, no re-render: callers write the
// result into a framer-motion value, which paints without React.

export type Rgb = [number, number, number]

export const hexToRgb = (hex: string): Rgb => {
  const clean = hex.replace(/^#/, '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = parseInt(full, 16)
  if (Number.isNaN(num) || full.length !== 6) return [0, 0, 0]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

const channel = (v: number): string =>
  Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, '0')

export const rgbToHex = ([r, g, b]: Rgb): string =>
  `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()

export const lerpHex = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex([
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ])
}

// Index-fraction stops for n slides: stop i is i/(n-1). A single slide
// has one stop at 0, so its colour holds across the whole scroll.
export const tintStops = (n: number): number[] =>
  n <= 1 ? [0] : Array.from({ length: n }, (_, i) => i / (n - 1))

// Desktop tint: sections have unequal heights, so index fractions
// cannot anchor the colour to the section in view (a long Quotes feed
// would put the FAQ stop nowhere near the FAQ). Instead the stops are
// the sections' activation scroll positions: section i becomes the
// section in view when its top crosses `clearance` px below the
// container top, so boundary_i = tops[i] - clearance. Around each
// boundary the tint dissolves from the outgoing hex to the incoming
// hex over a window W_i, and outside every window it sits exactly on
// the section in view's hex, so a long section at rest shows its own
// colour, not a blend. W_i is the viewport height capped by the gaps
// to the neighbouring boundaries, so windows never overlap: at the
// midpoint between two boundaries both neighbours agree on the
// section between them, and the function is continuous everywhere.
export const desktopTintAt = (
  tops: number[],
  hexes: string[],
  scrollTop: number,
  viewportHeight: number,
  clearance = 160,
): string => {
  if (hexes.length === 0) return '#000000'
  if (hexes.length === 1) return hexes[0]
  const boundaries: number[] = []
  for (let i = 1; i < tops.length; i++) boundaries.push(tops[i] - clearance)
  // Active section: the last one whose boundary has been crossed.
  let active = 0
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i] <= scrollTop) active = i + 1
  }
  // Blend windows around each boundary.
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i]
    const prevGap = i === 0 ? Infinity : b - boundaries[i - 1]
    const nextGap = i === boundaries.length - 1 ? Infinity : boundaries[i + 1] - b
    const w = Math.min(viewportHeight, prevGap, nextGap)
    if (w <= 0) continue
    const lo = b - w / 2
    const hi = b + w / 2
    if (scrollTop >= lo && scrollTop <= hi) {
      return lerpHex(hexes[i], hexes[i + 1], (scrollTop - lo) / w)
    }
  }
  return hexes[Math.min(active, hexes.length - 1)]
}

// The dissolved colour at scroll fraction t (0..1, clamped). Outside the
// range the nearest end colour holds; inside, the two neighbouring
// stops blend linearly.
export const tintAt = (stops: number[], hexes: string[], t: number): string => {
  if (hexes.length === 0) return '#000000'
  if (hexes.length === 1) return hexes[0]
  const clamped = Math.min(1, Math.max(0, t))
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (clamped <= b || i === stops.length - 2) {
      const local = b > a ? (clamped - a) / (b - a) : 0
      return lerpHex(hexes[i], hexes[i + 1], local)
    }
  }
  return hexes[hexes.length - 1]
}
