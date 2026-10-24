// GET /api/supply: cached onchain totalSupply for the OG collection.
//
// The /api/twitch pattern applied to supply: the chain read happens
// server-side once and Vercel's edge cache serves everyone for two
// minutes (s-maxage=120, stale-while-revalidate=300), instead of every
// visitor's browser hitting a public RPC. Clients fall back to their
// own direct RPC read if this endpoint is unreachable, and this
// endpoint falls back to the last verified supply (5,097, checked
// onchain 2026-10-23) flagged stale if every RPC is down, so the site
// never breaks or invents a number.

const CONTRACT = '0xbef648e3034e80efe152f3581117c1536fff5afc'
const TOTAL_SUPPLY_SELECTOR = '0x18160ddd' // totalSupply()
const REVEAL_BUFFER = 30 // final tokens stay hidden until reveal
const MAX_SUPPLY = 9010
const LAST_KNOWN_TOTAL_SUPPLY = 5097

const RPC_URLS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
]

const shape = (totalSupply, stale) => ({
  totalSupply,
  revealed: Math.max(0, totalSupply - REVEAL_BUFFER),
  maxSupply: MAX_SUPPLY,
  updatedAt: new Date().toISOString(),
  ...(stale ? { stale: true } : {}),
})

async function readTotalSupply(rpcUrl, fetchImpl) {
  const res = await fetchImpl(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: CONTRACT, data: TOTAL_SUPPLY_SELECTOR }, 'latest'],
    }),
  })
  if (!res.ok) throw new Error(`RPC responded ${res.status}`)
  const json = await res.json()
  const result = json?.result
  if (!result || result === '0x') throw new Error('empty eth_call result')
  const supply = parseInt(result, 16)
  if (!Number.isFinite(supply) || supply <= 0) throw new Error('unparsable totalSupply')
  return supply
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const fetchImpl = globalThis.fetch
  for (const rpcUrl of RPC_URLS) {
    try {
      const totalSupply = await readTotalSupply(rpcUrl, fetchImpl)
      return res.status(200).json(shape(totalSupply, false))
    } catch {
      // Try the next public RPC; only total failure serves the stale shape.
    }
  }
  return res.status(200).json(shape(LAST_KNOWN_TOTAL_SUPPLY, true))
}
