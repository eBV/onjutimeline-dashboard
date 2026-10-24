// Sign-in-once sessions for Quotes voting.
//
// Flow: the wallet signs ONE EIP-191 message (see SIGN_IN_MESSAGE) at
// api/auth.js; the server verifies it with viem and issues an opaque
// session token in an HTTP-only cookie. Only the token's SHA-256 hash is
// stored server-side, so a store leak does not leak usable sessions.
// Votes after that need no wallet interaction at all until the 30-day
// session expires.

import { createHash, randomBytes } from 'node:crypto'
import { SESSION_TTL_SECONDS } from './_store.js'

export const SESSION_COOKIE = 'ohnahji_quotes_session'

export const signInMessage = (address) =>
  [
    'Ohnahji Quotes sign-in',
    '',
    'Sign this message to prove this wallet is yours and enable voting on the Quotes tab.',
    'This is not a transaction, it costs nothing, and it cannot move funds.',
    '',
    `Wallet: ${address}`,
  ].join('\n')

export const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export const issueSession = async (store, res, address) => {
  const token = randomBytes(32).toString('hex')
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000
  await store.setSession(hashToken(token), { address: address.toLowerCase(), exp })
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`,
  )
  return { address: address.toLowerCase(), expiresAt: new Date(exp).toISOString() }
}

const parseCookies = (req) => {
  const header = req.headers?.cookie ?? ''
  const out = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return out
}

// Returns { address } for a valid, unexpired session, else null.
export const readSession = async (store, req) => {
  const token = parseCookies(req)[SESSION_COOKIE]
  if (!token) return null
  const record = await store.getSession(hashToken(token))
  if (!record || record.exp <= Date.now()) return null
  return { address: record.address }
}

export const clearSession = async (store, req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE]
  if (token) await store.deleteSession(hashToken(token))
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  )
}
