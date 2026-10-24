// POST /api/vote: cast, switch, or retract a quote vote.
//
// Requires the session cookie issued by POST /api/auth; the voter is
// ALWAYS the session's wallet, never anything from the request body.
// Body: { quoteId, direction } with direction 1 (up), -1 (down) or
// 0 (retract). Reddit semantics: sending the opposite direction
// switches the vote; deltas come from api/_votes.js so counts can never
// drift from the per-voter record.
//
// Response: { quoteId, up, down, score, yourVote }

import { SEED_IDS } from './_seed.js'
import { getStore } from './_store.js'
import { readSession } from './_session.js'
import { isDirection, voteDeltas, scoreOf } from './_votes.js'
import { readJsonBody } from './_http.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const store = getStore()
  const session = await readSession(store, req)
  if (!session) {
    return res.status(401).json({ error: 'sign in with your wallet to vote', code: 'SIGN_IN_REQUIRED' })
  }

  const body = await readJsonBody(req)
  if (!body) return res.status(400).json({ error: 'invalid JSON body' })
  const { quoteId, direction } = body
  if (typeof quoteId !== 'string' || !SEED_IDS.has(quoteId)) {
    return res.status(400).json({ error: 'unknown quote' })
  }
  if (!isDirection(direction)) {
    return res.status(400).json({ error: 'direction must be 1, -1 or 0' })
  }

  try {
    const prev = await store.getUserVoteOn(session.address, quoteId)
    if (prev === direction) {
      const counts = await store.getCounts()
      const c = { up: counts.up[quoteId] ?? 0, down: counts.down[quoteId] ?? 0 }
      return res.status(200).json({ quoteId, ...c, score: scoreOf(c), yourVote: prev })
    }
    const counts = await store.applyVote(session.address, quoteId, direction, voteDeltas(prev, direction))
    return res.status(200).json({ quoteId, ...counts, score: scoreOf(counts), yourVote: direction })
  } catch {
    return res.status(500).json({ error: 'vote could not be recorded', storage: store.mode })
  }
}
