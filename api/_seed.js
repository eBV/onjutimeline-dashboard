// The quote seed for the API: api/quotes-data.json, written by
// scripts/sync-quotes.mjs in the same pass as src/lib/quotes-data.json
// (byte-identical). Regenerate with: node scripts/sync-quotes.mjs
import seed from './quotes-data.json' with { type: 'json' }

export const SEED_QUOTES = seed
export const SEED_IDS = new Set(seed.map((q) => q.id))
