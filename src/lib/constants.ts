import { ipfsUrls } from './ipfs'

export const CONTRACT_ADDRESS = '0xbef648e3034e80efe152f3581117c1536fff5afc'

export const IPFS_CID_GENESIS = 'bafybeicwcmxvwmrpb36zq2uzs3ujhimoeqnxvrpalb2efymgeqowlxv42i'
export const IPFS_CID_METADATA = 'bafybeiccpacwmuyqs5whb4h7bk7pe7f7rmbsmy3yzbdl4rhk5em5zzgx3e'
export const IPFS_CID_MINT_PLACEHOLDER = 'bafybeibp75o3ffrwthhnq57x4xgnbyzjjucukzca5b2wemkejcud4fg2ye'
export const IPFS_CID_OKOLOTO = 'Qmdaiju45QxWibywnWftvKQgxPy1TJxBuGEUQa4Fevv9Sf'

// Base URLs (no trailing slash) for the genesis image CID across the
// resilient gateway chain, best first. See src/lib/ipfs.ts for the live
// test evidence behind the order; cloudflare-ipfs.com was removed (dead).
export const GATEWAYS = ipfsUrls(IPFS_CID_GENESIS, '').map((u) => u.replace(/\/$/, ''))

export const getNFTImage = (tokenId: number): string => `${GATEWAYS[0]}/${tokenId}.png`
