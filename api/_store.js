// Storage for Quotes votes and sign-in sessions, behind one interface.
//
// Preferred backend: Vercel KV (Upstash Redis) reached over its REST API
// with plain fetch, so the serverless functions need no extra runtime
// dependency. Credentials come only from the environment:
//   KV_REST_API_URL + KV_REST_API_TOKEN, or
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//
// Fallback: an in-memory store. It is DEV-ONLY by design: state lives in
// the function instance and evaporates on cold start or redeploy. The
// API reports which mode it is in (the `storage` field) so memory mode
// is never mistaken for persistence.
//
// Data layout (KV hashes):
//   votes:up / votes:down        quoteId -> count (HINCRBY, atomic)
//   votes:by:{quoteId}           address -> direction (source of truth)
//   votes:user:{address}         quoteId -> direction (per-voter index)
//   quotes:session:{tokenHash}   JSON {address, exp} with TTL

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

const flatToObject = (flat) => {
  const obj = {}
  if (Array.isArray(flat)) {
    for (let i = 0; i + 1 < flat.length; i += 2) obj[flat[i]] = flat[i + 1]
  }
  return obj
}

const numericMap = (obj) => {
  const out = {}
  for (const [k, v] of Object.entries(obj)) out[k] = Number(v) || 0
  return out
}

class KvStore {
  constructor(url, token) {
    this.mode = 'kv'
    this.url = url.replace(/\/+$/, '')
    this.token = token
  }

  async pipeline(commands) {
    const res = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    })
    if (!res.ok) throw new Error(`KV pipeline failed: ${res.status}`)
    const results = await res.json()
    return results.map((r) => {
      if (r.error) throw new Error(`KV command failed: ${r.error}`)
      return r.result
    })
  }

  async getCounts() {
    const [up, down] = await this.pipeline([
      ['HGETALL', 'votes:up'],
      ['HGETALL', 'votes:down'],
    ])
    return { up: numericMap(flatToObject(up)), down: numericMap(flatToObject(down)) }
  }

  async getUserVotes(address) {
    const [map] = await this.pipeline([['HGETALL', `votes:user:${address}`]])
    return numericMap(flatToObject(map))
  }

  async getUserVoteOn(address, quoteId) {
    const [value] = await this.pipeline([['HGET', `votes:by:${quoteId}`, address]])
    return value == null ? 0 : Number(value) || 0
  }

  async applyVote(address, quoteId, next, deltas) {
    const commands = []
    if (next === 0) {
      commands.push(['HDEL', `votes:by:${quoteId}`, address])
      commands.push(['HDEL', `votes:user:${address}`, quoteId])
    } else {
      commands.push(['HSET', `votes:by:${quoteId}`, address, String(next)])
      commands.push(['HSET', `votes:user:${address}`, quoteId, String(next)])
    }
    if (deltas.upDelta !== 0) commands.push(['HINCRBY', 'votes:up', quoteId, deltas.upDelta])
    if (deltas.downDelta !== 0) commands.push(['HINCRBY', 'votes:down', quoteId, deltas.downDelta])
    await this.pipeline(commands)
    const [up, down] = await this.pipeline([
      ['HGET', 'votes:up', quoteId],
      ['HGET', 'votes:down', quoteId],
    ])
    return { up: Math.max(0, Number(up) || 0), down: Math.max(0, Number(down) || 0) }
  }

  async setSession(tokenHash, record) {
    await this.pipeline([
      ['SET', `quotes:session:${tokenHash}`, JSON.stringify(record), 'EX', SESSION_TTL_SECONDS],
    ])
  }

  async getSession(tokenHash) {
    const [raw] = await this.pipeline([['GET', `quotes:session:${tokenHash}`]])
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  async deleteSession(tokenHash) {
    await this.pipeline([['DEL', `quotes:session:${tokenHash}`]])
  }
}

class MemoryStore {
  constructor() {
    this.mode = 'memory'
    this.up = new Map()
    this.down = new Map()
    this.byQuote = new Map() // quoteId -> Map(address -> direction)
    this.sessions = new Map() // tokenHash -> {address, exp}
  }

  async getCounts() {
    return { up: Object.fromEntries(this.up), down: Object.fromEntries(this.down) }
  }

  async getUserVotes(address) {
    const out = {}
    for (const [quoteId, voters] of this.byQuote) {
      const d = voters.get(address)
      if (d) out[quoteId] = d
    }
    return out
  }

  async getUserVoteOn(address, quoteId) {
    return this.byQuote.get(quoteId)?.get(address) ?? 0
  }

  async applyVote(address, quoteId, next, deltas) {
    if (!this.byQuote.has(quoteId)) this.byQuote.set(quoteId, new Map())
    const voters = this.byQuote.get(quoteId)
    if (next === 0) voters.delete(address)
    else voters.set(address, next)
    const bump = (map, delta) => map.set(quoteId, Math.max(0, (map.get(quoteId) ?? 0) + delta))
    if (deltas.upDelta !== 0) bump(this.up, deltas.upDelta)
    if (deltas.downDelta !== 0) bump(this.down, deltas.downDelta)
    return { up: this.up.get(quoteId) ?? 0, down: this.down.get(quoteId) ?? 0 }
  }

  async setSession(tokenHash, record) {
    this.sessions.set(tokenHash, record)
  }

  async getSession(tokenHash) {
    const record = this.sessions.get(tokenHash)
    if (!record) return null
    if (record.exp <= Date.now()) {
      this.sessions.delete(tokenHash)
      return null
    }
    return record
  }

  async deleteSession(tokenHash) {
    this.sessions.delete(tokenHash)
  }
}

let cached = null

export const getStore = () => {
  if (cached) return cached
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  cached = url && token ? new KvStore(url, token) : new MemoryStore()
  return cached
}

// Test hook: lets unit tests swap in a fresh memory store.
export const __setStoreForTests = (store) => {
  cached = store
}

export { KvStore, MemoryStore, SESSION_TTL_SECONDS }
