// /api/admin/config: the owner's site controls, behind admin authz.
//
//   GET  returns the STORED config document (not merged with defaults;
//        null until the first save) so the panel can show what is
//        actually persisted.
//   PUT  replaces the stored config. The body IS the config document;
//        it is validated strictly (known slide paths only, #RRGGBB
//        hexes, boolean features, no unknown keys) and normalized to
//        the complete document before storing. The hero slide "/" is
//        forced visible by the normalize step.
//
// Both methods require a valid sign-in session (api/auth.js) whose
// wallet is on the admin allowlist (api/_admin.js): no session is a
// 401, a non-admin session is a 403. The client-side hidden tab is
// only a convenience; this handler is the enforcement.

import { getStore } from '../_store.js'
import { requireAdmin } from '../_admin.js'
import { validateSiteConfig, normalizeSiteConfig } from '../_config.js'
import { readJsonBody } from '../_http.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const store = getStore()
  const session = await requireAdmin(store, req, res)
  if (!session) return // requireAdmin already wrote the 401/403

  if (req.method === 'GET') {
    let stored = null
    try {
      stored = await store.getSiteConfig()
    } catch {
      stored = null
    }
    return res.status(200).json({ config: stored, storage: store.mode })
  }

  const body = await readJsonBody(req)
  if (!body) return res.status(400).json({ error: 'invalid JSON body' })
  const { ok, errors } = validateSiteConfig(body)
  if (!ok) return res.status(400).json({ error: 'invalid site config', details: errors })

  const normalized = normalizeSiteConfig(body)
  try {
    await store.setSiteConfig(normalized)
  } catch {
    return res.status(500).json({ error: 'config could not be saved', storage: store.mode })
  }
  return res.status(200).json({ config: normalized, storage: store.mode })
}
