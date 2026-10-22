import { ThirdwebProvider, ConnectButton } from 'thirdweb/react'
import { getThirdwebClient, getChain } from '../lib/thirdweb'

/**
 * Persistent wallet button (top-right shell). Code-split so thirdweb
 * (~1MB) loads async instead of bloating the entry chunk.
 * Carries its own ThirdwebProvider — no provider needed at App root.
 */
export default function WalletConnect() {
  const client = getThirdwebClient()
  const chain = getChain()

  return (
    <ThirdwebProvider>
      <div className="fixed top-3 right-3 z-[90]">
        <ConnectButton
          client={client}
          chain={chain}
          theme="dark"
          connectButton={{
            label: 'CONNECT',
            className:
              '!bg-transparent !text-ohnahji-pink !border !border-ohnahji-pink/40 !rounded-lg !font-bold !text-xs !px-3 !py-1.5 !h-auto hover:!bg-ohnahji-pink/10 !transition-all',
          }}
          detailsButton={{
            className:
              '!bg-transparent !text-ohnahji-pink !border !border-ohnahji-pink/40 !rounded-lg !font-bold !text-xs !px-3 !py-1.5 !h-auto hover:!bg-ohnahji-pink/10 !transition-all',
          }}
        />
      </div>
    </ThirdwebProvider>
  )
}
