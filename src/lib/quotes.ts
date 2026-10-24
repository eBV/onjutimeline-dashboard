// Quotes seed access. The data itself is generated from the one-liner
// archive by scripts/sync-quotes.mjs into quotes-data.json; do not edit
// the JSON by hand.
import seedData from './quotes-data.json'

export interface SeedQuote {
  id: string
  text: string
  day: number
  date: string
  weekday: string
  month: number
  year: number
  context?: string
}

export const SEED_QUOTES: SeedQuote[] = seedData as SeedQuote[]
