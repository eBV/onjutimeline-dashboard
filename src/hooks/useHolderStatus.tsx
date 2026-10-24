import React, { createContext, useContext } from 'react'
import { useActiveAccount, useIsAutoConnecting } from 'thirdweb/react'
import { useQuery } from '@tanstack/react-query'
import { CONTRACT_ADDRESS } from '../lib/constants'

// App-level OG holder check. One balanceOf read on the OG contract gates
// both the deck composition (the /vault and /firstlook slides exist only
// for proven holders) and the Vault slide's own internal states, so the
// whole app shares a single query. Default in every non-holder state
// (disconnected, checking, error) is NOT a holder: gated slides stay
// hidden until the chain proves a balance.

const RPC_URL = 'https://ethereum-rpc.publicnode.com'

export const OG_BALANCE_QUERY_KEY = 'og-balance'

export const fetchOgBalance = async (address: string): Promise<number> => {
  const data = '0x70a08231' + address.slice(2).toLowerCase().padStart(64, '0')
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: CONTRACT_ADDRESS, data }, 'latest'],
    }),
  })
  if (!response.ok) throw new Error(`RPC responded ${response.status}`)
  const json = await response.json()
  const balance = parseInt(json?.result, 16)
  if (!Number.isFinite(balance)) throw new Error('Could not read your balance')
  return balance
}

interface HolderStatus {
  address?: string
  isConnected: boolean
  balance?: number
  isHolder: boolean
  isChecking: boolean
  // True while thirdweb is still restoring a previous wallet session.
  // A gated deep link must wait this out: on a cold load the account (and
  // therefore the holder proof) arrives a beat after first paint, and
  // bouncing to / before it lands would make holder deep links useless.
  isAutoConnecting: boolean
  // Either form of "holder state not settled yet".
  isPending: boolean
  isError: boolean
  refetch: () => void
}

const HolderContext = createContext<HolderStatus | undefined>(undefined)

export const HolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const account = useActiveAccount()
  const isAutoConnecting = useIsAutoConnecting()
  const address = account?.address

  const balanceQuery = useQuery({
    queryKey: [OG_BALANCE_QUERY_KEY, address],
    queryFn: () => fetchOgBalance(address as string),
    enabled: !!address,
    staleTime: 1000 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const isChecking = !!address && balanceQuery.isLoading
  const value: HolderStatus = {
    address,
    isConnected: !!address,
    balance: balanceQuery.data,
    isHolder: (balanceQuery.data ?? 0) > 0,
    isChecking,
    isAutoConnecting,
    isPending: isChecking || isAutoConnecting,
    isError: !!address && balanceQuery.isError,
    refetch: () => balanceQuery.refetch(),
  }

  return <HolderContext.Provider value={value}>{children}</HolderContext.Provider>
}

export const useHolderStatus = () => {
  const context = useContext(HolderContext)
  if (context === undefined) {
    throw new Error('useHolderStatus must be used within a HolderProvider')
  }
  return context
}
