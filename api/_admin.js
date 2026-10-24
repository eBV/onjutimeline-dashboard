// Admin allowlist for the site-config API.
//
// The ONLY enforcement that matters lives here, server-side: a request
// can read or write the stored site config only when it carries a
// valid sign-in session (api/_session.js) whose wallet is on this
// list. The hidden ADMIN tab on the client is a convenience; hiding it
// is not the security boundary, this check is.
//
// Owner wallet, ENS-verified both directions on 2026-10-23:
// ohnahji.eth = 0x64A15b1D2DE581097CB48e5D82619203E24BB3e1
// Add future admins by appending their lowercase address here (and to
// the client copy in src/lib/admin.ts, which only controls tab
// visibility).

import { readSession } from './_session.js'

export const ADMIN_ADDRESSES = ['0x64a15b1d2de581097cb48e5d82619203e24bb3e1']

export const isAdminAddress = (address) =>
  typeof address === 'string' && ADMIN_ADDRESSES.includes(address.toLowerCase())

// Returns the session when the request is an authenticated admin, else
// writes the 401/403 response and returns null.
export const requireAdmin = async (store, req, res) => {
  const session = await readSession(store, req)
  if (!session) {
    res.status(401).json({ error: 'sign in with your wallet first', code: 'SIGN_IN_REQUIRED' })
    return null
  }
  if (!isAdminAddress(session.address)) {
    res.status(403).json({ error: 'this wallet is not a site admin', code: 'NOT_ADMIN' })
    return null
  }
  return session
}
