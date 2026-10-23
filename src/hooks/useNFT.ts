import { useQuery } from '@tanstack/react-query'
import { IPFS_CID_METADATA } from '../lib/constants'
import { fetchIpfs } from '../lib/ipfs'


/**
 * Hook to get ETH price in USD using TanStack Query
 */
export const useETHPrice = () => {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      return data.ethereum?.usd as number
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 15, // Polling every 15 minutes
  })
}

/**
 * Hook to fetch metadata for a specific token using TanStack Query
 */
export const useNFTMetadata = (tokenId: number | null) => {
  return useQuery({
    queryKey: ['nftMetadata', tokenId],
    queryFn: async () => {
      if (tokenId === null) return null
      // Resilient gateway chain (was dweb.link only, which rate limits
      // with 429): retries with backoff, then rotates gateways.
      const response = await fetchIpfs(IPFS_CID_METADATA, `${tokenId}.json`)
      return await response.json()
    },
    enabled: tokenId !== null,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
