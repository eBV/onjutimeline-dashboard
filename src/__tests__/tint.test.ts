import { describe, expect, test } from 'vitest'
import { desktopTintAt, hexToRgb, lerpHex, rgbToHex, tintAt, tintStops } from '../lib/tint'

// Brand hexes used across the deck.
const PINK = '#FE517E'
const MAROON = '#3C0010'
const GOLD = '#F1C40F'

describe('tintStops', () => {
  test('index fractions for n slides', () => {
    expect(tintStops(4)).toEqual([0, 1 / 3, 2 / 3, 1])
  })

  test('a single slide holds one stop at 0', () => {
    expect(tintStops(1)).toEqual([0])
  })
})

describe('hex parsing', () => {
  test('six digit hex', () => {
    expect(hexToRgb(PINK)).toEqual([254, 81, 126])
  })

  test('three digit hex expands', () => {
    expect(hexToRgb('#000')).toEqual([0, 0, 0])
    expect(hexToRgb('#FFF')).toEqual([255, 255, 255])
  })

  test('round trip', () => {
    expect(rgbToHex([254, 81, 126])).toBe(PINK)
  })
})

describe('tintAt', () => {
  test('stops are bit-exact slide hexes', () => {
    const stops = tintStops(3)
    expect(tintAt(stops, [MAROON, PINK, GOLD], 0)).toBe(MAROON)
    expect(tintAt(stops, [MAROON, PINK, GOLD], 0.5)).toBe(PINK)
    expect(tintAt(stops, [MAROON, PINK, GOLD], 1)).toBe(GOLD)
  })

  test('midpoints blend linearly in RGB', () => {
    // Pink (254,81,126) to maroon (60,0,16): midpoint (157,41,71).
    expect(lerpHex(PINK, MAROON, 0.5)).toBe('#9D2947')
    expect(tintAt([0, 1], [PINK, MAROON], 0.5)).toBe('#9D2947')
  })

  test('out of range clamps to the nearest end', () => {
    expect(tintAt([0, 1], [PINK, MAROON], -0.5)).toBe(PINK)
    expect(tintAt([0, 1], [PINK, MAROON], 1.5)).toBe(MAROON)
  })

  test('a single hex holds everywhere', () => {
    expect(tintAt([0], [PINK], 0.7)).toBe(PINK)
  })

  test('no hexes falls back to black', () => {
    expect(tintAt([], [], 0.5)).toBe('#000000')
  })
})

describe('desktopTintAt', () => {
  // Three sections: tops at 0, 1000, 2000; viewport 900; clearance 160,
  // so boundaries at 840 and 1840. Windows are the viewport height
  // capped by the 1000px gaps: 900 wide, centred on each boundary.
  const TOPS = [0, 1000, 2000]
  const HEXES = [MAROON, GOLD, PINK]

  test('page top and deep inside a section hold exact hexes', () => {
    expect(desktopTintAt(TOPS, HEXES, 0, 900)).toBe(MAROON)
    // Windows are 390..1290 and 1390..2290, so 1350 sits in the flat
    // gold gap between them.
    expect(desktopTintAt(TOPS, HEXES, 1350, 900)).toBe(GOLD)
    expect(desktopTintAt(TOPS, HEXES, 3000, 900)).toBe(PINK)
  })

  test('a boundary is the exact midpoint blend', () => {
    // Boundary 1 at 840: maroon (60,0,16) to gold (241,196,15)
    // midpoint (151,98,16).
    expect(desktopTintAt(TOPS, HEXES, 840, 900)).toBe('#976210')
  })

  test('window edges land exactly on the neighbouring hexes', () => {
    // Window 1 spans 390..1290: start is maroon, end is gold.
    expect(desktopTintAt(TOPS, HEXES, 390, 900)).toBe(MAROON)
    expect(desktopTintAt(TOPS, HEXES, 1290, 900)).toBe(GOLD)
  })

  test('short sections cap the window by the gap, staying continuous', () => {
    // Tops 0, 300, 600: boundaries 140, 440; gaps 300, so windows are
    // 300 wide and touch at 290 without overlapping. At the touch
    // point both neighbours agree on the middle hex.
    expect(desktopTintAt([0, 300, 600], HEXES, 290, 900)).toBe(GOLD)
    expect(desktopTintAt([0, 300, 600], HEXES, 140, 900)).toBe('#976210')
  })

  test('a single section holds its hex everywhere', () => {
    expect(desktopTintAt([0], [PINK], 5000, 900)).toBe(PINK)
  })
})
