// POST /api/auth: wallet sign-in for Quotes voting.
//
// Body: { address, signature } where signature is the wallet's EIP-191
// signature over the canonical message from api/_session.js
// (signInMessage). The server verifies with viem's verifyMessage that
// the signature recovers to the claimed address; on success it issues a
// 30-day HTTP-only session cookie (see api/_session.js). No transaction,
// no gas, and nothing is stored onchain.
//
// POST /api/auth with { action: 'signout' } clears the session.

import { verifyMessage } from 'viem'
import { getStore } from './_store.js'
import { signInMessage, issueSession, clearSession } from './_session.js'
import { readJsonBody, isAddress } from './_http.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const store = getStore()
  const body = await readJsonBody(req)
  if (!body) return res.status(400).json({ error: 'invalid JSON body' })

  if (body.action === 'signout') {
    await clearSession(store, req, res)
    return res.status(200).json({ signedOut: true })
  }

  const { address, signature } = body
  if (!isAddress(address)) return res.status(400).json({ error: 'a valid wallet address is required' })
  if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return res.status(400).json({ error: 'a signature is required' })
  }

  let valid = false
  try {
    valid = await verifyMessage({ address, message: signInMessage(address), signature })
  } catch {
    valid = false
  }
  if (!valid) return res.status(401).json({ error: 'signature does not match this wallet' })

  const session = await issueSession(store, res, address)
  return res.status(200).json({ address: session.address, expiresAt: session.expiresAt, storage: store.mode })
}
