import {
  CONTRACT_ADDRESS,
  IPFS_CID_GENESIS,
  IPFS_CID_METADATA,
  IPFS_CID_MINT_PLACEHOLDER,
  GATEWAYS,
  getNFTImage,
} from '../lib/constants'

describe('constants', () => {
  test('CONTRACT_ADDRESS is a valid Ethereum address', () => {
    expect(CONTRACT_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  test('IPFS CIDs are non-empty strings', () => {
    expect(IPFS_CID_GENESIS.length).toBeGreaterThan(0)
    expect(IPFS_CID_METADATA.length).toBeGreaterThan(0)
    expect(IPFS_CID_MINT_PLACEHOLDER.length).toBeGreaterThan(0)
  })

  test('IPFS CIDs are distinct', () => {
    const cids = new Set([IPFS_CID_GENESIS, IPFS_CID_METADATA, IPFS_CID_MINT_PLACEHOLDER])
    expect(cids.size).toBe(3)
  })

  test('GATEWAYS has 4 entries each containing IPFS_CID_GENESIS', () => {
    expect(GATEWAYS).toHaveLength(4)
    for (const gateway of GATEWAYS) {
      expect(gateway).toContain(IPFS_CID_GENESIS)
    }
  })

  test('GATEWAYS entries are distinct URLs', () => {
    expect(new Set(GATEWAYS).size).toBe(4)
  })

  test('getNFTImage returns a URL ending in /<id>.png', () => {
    expect(getNFTImage(1)).toMatch(/\/1\.png$/)
    expect(getNFTImage(8888)).toMatch(/\/8888\.png$/)
  })

  test('getNFTImage uses the first gateway', () => {
    expect(getNFTImage(42)).toContain(GATEWAYS[0])
  })
})
