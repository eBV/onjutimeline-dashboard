import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach, afterEach } from 'vitest'
import { useActiveAccount } from 'thirdweb/react'
import { HolderProvider, useHolderStatus } from '../hooks/useHolderStatus'

// The holder gate reads the connected account from thirdweb; stub it so
// each case controls the wallet, and stub fetch so the balanceOf eth_call
// returns a scripted balance.
vi.mock('thirdweb/react', () => ({
  useActiveAccount: vi.fn(),
  useIsAutoConnecting: vi.fn(() => false),
}))

const mockAccount = useActiveAccount as unknown as ReturnType<typeof vi.fn>

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <HolderProvider>{children}</HolderProvider>
    </QueryClientProvider>
  )
}

const stubBalance = (hex: string) => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ jsonrpc: '2.0', id: 1, result: hex }),
  })))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useHolderStatus', () => {
  test('disconnected wallet is not a holder and never checks', () => {
    mockAccount.mockReturnValue(undefined)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { result } = renderHook(() => useHolderStatus(), { wrapper })
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isHolder).toBe(false)
    expect(result.current.isChecking).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('a stubbed balanceOf of 0 keeps the wallet a non-holder', async () => {
    mockAccount.mockReturnValue({ address: ADDRESS })
    stubBalance('0x0')
    const { result } = renderHook(() => useHolderStatus(), { wrapper })
    await waitFor(() => expect(result.current.balance).toBe(0))
    expect(result.current.isHolder).toBe(false)
  })

  test('a stubbed balanceOf above 0 proves the holder', async () => {
    mockAccount.mockReturnValue({ address: ADDRESS })
    stubBalance('0x3')
    const { result } = renderHook(() => useHolderStatus(), { wrapper })
    await waitFor(() => expect(result.current.isHolder).toBe(true), { timeout: 5000 })
    expect(result.current.balance).toBe(3)
    expect(result.current.isChecking).toBe(false)
  })

  test('an RPC failure is an error state, never a holder', async () => {
    mockAccount.mockReturnValue({ address: ADDRESS })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    const { result } = renderHook(() => useHolderStatus(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 8000 })
    expect(result.current.isHolder).toBe(false)
  })
})
