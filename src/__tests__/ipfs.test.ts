import { IPFS_GATEWAYS, ipfsUrls, ipfsAttemptPlan } from '../lib/ipfs'
import { IPFS_CID_GENESIS, IPFS_CID_OKOLOTO } from '../lib/constants'

describe('ipfs gateway chain', () => {
  test('pinata is first and cloudflare-ipfs is gone', () => {
    expect(IPFS_GATEWAYS[0].name).toBe('pinata')
    expect(IPFS_GATEWAYS.map((g) => g.name)).not.toContain('cloudflare')
    for (const url of ipfsUrls(IPFS_CID_GENESIS, '1.png')) {
      expect(url).not.toContain('cloudflare-ipfs.com')
    }
  })

  test('every URL ends with the requested path and contains the CID', () => {
    for (const url of ipfsUrls(IPFS_CID_GENESIS, '2372.png')) {
      expect(url).toContain(IPFS_CID_GENESIS)
      expect(url).toMatch(/\/2372\.png$/)
    }
  })

  test('CIDv0 (Okoloto) never gets an invalid subdomain URL', () => {
    for (const url of ipfsUrls(IPFS_CID_OKOLOTO, '640.jpg')) {
      expect(url).toContain(IPFS_CID_OKOLOTO)
      expect(url).not.toContain(`${IPFS_CID_OKOLOTO}.ipfs.`)
    }
  })

  test('attempt plan retries the first gateway three times, others twice', () => {
    const plan = ipfsAttemptPlan(5)
    expect(plan.filter((g) => g === 0)).toHaveLength(3)
    for (const g of [1, 2, 3, 4]) {
      expect(plan.filter((x) => x === g)).toHaveLength(2)
    }
    // Order is sequential rotation, not interleaved.
    expect(plan).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4])
  })
})
