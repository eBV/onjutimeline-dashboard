// GET /api/quotes: the full one-liner archive merged with live vote
// counts. Public; reading never needs a wallet.
//
// Response: {
//   storage: 'kv' | 'memory',   // 'memory' means votes are NOT persistent
//   quotes: [{ id, text, day, date, weekday, month, year, context?,
//              up, down, score }],   // HOT order: score desc, newest first
//   voter?: '0x...', votes?: { [quoteId]: 1 | -1 }   // only with ?voter=
// }
//
// The optional ?voter=0x... variant returns that wallet's own vote map
// so the UI can highlight its arrows; a wallet address is public info,
// so reading its map needs no auth. The personalized variant is never
// CDN-cached.

import { SEED_QUOTES } from './_seed.js'
import { getStore } from './_store.js'
import { scoreOf } from './_votes.js'
import { isAddress } from './_http.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const store = getStore()
  try {
    const counts = await store.getCounts()
    const quotes = SEED_QUOTES.map((q) => {
      const c = { up: counts.up[q.id] ?? 0, down: counts.down[q.id] ?? 0 }
      return { ...q, up: c.up, down: c.down, score: scoreOf(c) }
    }).sort((a, b) => b.score - a.score || b.day - a.day || (a.id < b.id ? -1 : 1))

    const voter = typeof req.query?.voter === 'string' ? req.query.voter : undefined
    if (voter && isAddress(voter)) {
      res.setHeader('Cache-Control', 'private, no-store')
      const votes = await store.getUserVotes(voter.toLowerCase())
      return res.status(200).json({ storage: store.mode, quotes, voter: voter.toLowerCase(), votes })
    }

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60')
    return res.status(200).json({ storage: store.mode, quotes })
  } catch (err) {
    return res.status(500).json({ error: 'quotes unavailable', storage: store.mode })
  }
}
