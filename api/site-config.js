// GET /api/site-config: the EFFECTIVE site config for every visitor.
//
// Public; reading never needs a wallet. Returns the stored document
// merged over the code defaults (api/_config.js), so the response is
// always a complete, valid config even when nothing has ever been
// saved or the store is unreachable. `storage` reports the backend
// honestly: 'memory' means admin edits reset on cold starts.
//
// Edge-cached for a minute: an admin edit can take up to ~60s to reach
// a brand-new visitor; the admin's own client refetches immediately.

import { getStore } from './_store.js'
import { mergeSiteConfig } from './_config.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const store = getStore()
  let stored = null
  try {
    stored = await store.getSiteConfig()
  } catch {
    stored = null
  }
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  return res.status(200).json({ config: mergeSiteConfig(stored), storage: store.mode })
}
