import { SEED_QUOTES } from '../lib/quotes'

// The seed is generated (scripts/sync-quotes.mjs); these tests pin the
// invariants the Quotes tab and the vote API rely on: stable unique ids
// and dates derived from the Day 424 = 2026-10-15 anchor.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

describe('quotes seed', () => {
  test('the full archive is present (hundreds of quotes, Days 413-432)', () => {
    expect(SEED_QUOTES.length).toBeGreaterThan(300)
    const days = new Set(SEED_QUOTES.map((q) => q.day))
    expect(Math.min(...days)).toBe(413)
    expect(Math.max(...days)).toBe(432)
  })

  test('ids are unique and shaped dNNN-NN', () => {
    const ids = SEED_QUOTES.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^d\d{3}-\d{2}$/)
  })

  test('every record carries the anchor-derived date fields', () => {
    for (const q of SEED_QUOTES) {
      const expected = new Date(Date.UTC(2026, 9, 15) + (q.day - 424) * 86400000)
      expect(q.date).toBe(expected.toISOString().slice(0, 10))
      expect(q.weekday).toBe(WEEKDAYS[expected.getUTCDay()])
      expect(q.month).toBe(expected.getUTCMonth() + 1)
      expect(q.year).toBe(expected.getUTCFullYear())
      expect(q.text.length).toBeGreaterThan(0)
    }
  })

  test('no record is a known do-not-attribute speaker line', () => {
    // The generator excludes relayed and guest lines at the source; the
    // seed must never carry attribution notes as quote text.
    for (const q of SEED_QUOTES) {
      expect(q.text).not.toMatch(/Speaker confidence/i)
      expect(q.text).not.toMatch(/do not attribute/i)
    }
  })
})
