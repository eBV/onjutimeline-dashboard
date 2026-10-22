// Resilient IPFS access.
//
// Live gateway tests (2026-10-22, curl -4, redirects followed with -L;
// genesis 2372.png, Okoloto 640.jpg, mint NoRevealHolder.png):
//   gateway.pinata.cloud  200 direct image for genesis (260,079 bytes)
//                         and Okoloto; timed out once on the mint image
//   nftstorage.link       302; landing varies run to run (200 via
//                         assets.contract.metaplex.com with the same
//                         260,079 bytes in one run, 429 via ipfs.io in
//                         another), so it sits behind pinata as fallback
//   w3s.link subdomain    301 to its own CDN host or onwards, then 429
//   dweb.link subdomain   429 (rate limited; transient, IP dependent)
//   ipfs.io               429 (rate limited; transient, IP dependent)
//   cloudflare-ipfs.com   dead (connection failure); removed entirely
//
// 429s are transient, so the loaders below retry the earlier gateways
// with backoff before rotating, instead of burning the whole chain on
// the first error the way the old onError cascade did. The placeholder
// image is only a true last resort after every gateway and retry fails.

const isCidV1 = (cid: string) => cid.startsWith('bafy') || cid.startsWith('bafk') || cid.startsWith('bafr')

interface GatewayDef {
  name: string
  url: (cid: string, path: string) => string
}

// Ordered by the 2026-10-22 live test results: pinata first (clean 200s),
// nftstorage second (its redirect landed 200 for every CID tested),
// w3s third (redirects, then rate limited this IP), then the two big
// public gateways that were 429ing but are usually reliable.
export const IPFS_GATEWAYS: GatewayDef[] = [
  {
    name: 'pinata',
    url: (cid, path) => `https://gateway.pinata.cloud/ipfs/${cid}/${path}`,
  },
  {
    name: 'nftstorage',
    url: (cid, path) => `https://nftstorage.link/ipfs/${cid}/${path}`,
  },
  {
    name: 'w3s',
    url: (cid, path) =>
      isCidV1(cid) ? `https://${cid}.ipfs.w3s.link/${path}` : `https://w3s.link/ipfs/${cid}/${path}`,
  },
  {
    name: 'dweb',
    url: (cid, path) =>
      isCidV1(cid) ? `https://${cid}.ipfs.dweb.link/${path}` : `https://dweb.link/ipfs/${cid}/${path}`,
  },
  {
    name: 'ipfs.io',
    url: (cid, path) => `https://ipfs.io/ipfs/${cid}/${path}`,
  },
]

/** Ordered candidate URLs for one IPFS object, best gateway first. */
export const ipfsUrls = (cid: string, path: string): string[] =>
  IPFS_GATEWAYS.map((g) => g.url(cid, path))

/** Attempt plan as indices into ipfsUrls(): the first gateway gets three
 *  tries (429 backoff), every later gateway gets two. */
export const ipfsAttemptPlan = (gatewayCount: number): number[] => {
  const plan: number[] = []
  for (let g = 0; g < gatewayCount; g++) {
    plan.push(g, g)
    if (g === 0) plan.push(g)
  }
  return plan
}

const backoffMs = (attemptForGateway: number) => 500 * Math.pow(2, attemptForGateway)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetch an IPFS object (e.g. token metadata JSON) walking the gateway
 * order with per-gateway retries. Resolves with the first ok Response;
 * throws after every gateway and retry is exhausted.
 */
export async function fetchIpfs(cid: string, path: string): Promise<Response> {
  const urls = ipfsUrls(cid, path)
  let lastError: unknown = null

  for (let g = 0; g < urls.length; g++) {
    const maxAttempts = g === 0 ? 3 : 2
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await sleep(backoffMs(attempt))
      try {
        const response = await fetch(urls[g])
        if (response.ok) return response
        lastError = new Error(`IPFS gateway ${IPFS_GATEWAYS[g].name} returned ${response.status}`)
        // 429 and 5xx are worth retrying this gateway; other statuses
        // (e.g. 404) will not heal, so rotate to the next gateway.
        if (response.status !== 429 && response.status < 500) break
      } catch (err) {
        lastError = err
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All IPFS gateways failed')
}

export const placeholderImage = (text: string, size = 400): string =>
  `https://via.placeholder.com/${size}/FE517E/FFFFFF?text=${encodeURIComponent(text)}`
