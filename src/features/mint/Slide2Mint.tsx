import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton, useActiveAccount, useSendTransaction } from 'thirdweb/react'
import { getContract, prepareContractCall, toWei } from 'thirdweb'
import { useETHPrice } from '../../hooks/useNFT'
import { useStore } from '../../hooks/useStore'
import { CONTRACT_ADDRESS, IPFS_CID_MINT_PLACEHOLDER } from '../../lib/constants'

const MINT_PLACEHOLDER = `https://${IPFS_CID_MINT_PLACEHOLDER}.ipfs.dweb.link/NoRevealHolder.png`

const Slide2Mint = () => {
  const [quantity, setQuantity] = useState(1)
  const pricePerNFT = 0.005
  const totalPrice = quantity * pricePerNFT
  const account = useActiveAccount()
  const ethPriceQuery = useETHPrice()
  const ethPrice = ethPriceQuery.data
  const { client, chain } = useStore()

  const contract = getContract({ client, chain, address: CONTRACT_ADDRESS })
  const { mutate: sendTransaction, isPending } = useSendTransaction()

  const handleMint = () => {
    const tx = prepareContractCall({
      contract,
      method: 'function mint(uint256 quantity) payable',
      params: [BigInt(quantity)],
      value: toWei(totalPrice.toString()),
    })
    sendTransaction(tx)
  }

  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-5">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <div>
            <span className="dash-badge mb-3">Spring 2026</span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none mt-3">
              Spring '26<br />
              <span className="text-ohnahji-pink">Drop</span>
            </h1>
            <p className="text-dash-muted text-sm md:text-base mt-3 max-w-sm">
              Limited edition mint. Join the revolution.
            </p>
          </div>

          {/* Mint stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Price', value: `${pricePerNFT} ETH` },
              { label: 'Max per tx', value: '10' },
              { label: 'Network', value: 'Ethereum' },
              { label: 'Contract', value: `${CONTRACT_ADDRESS.slice(0,5)}...${CONTRACT_ADDRESS.slice(-4)}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-xl"
                style={{ background: '#161616', border: '1px solid #2a2a2a' }}
              >
                <div className="dash-label mb-1">{stat.label}</div>
                <div className="text-white font-bold text-sm leading-none">{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right column — mint card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          {/* Preview image */}
          <div className="h-44 md:h-56 overflow-hidden">
            <img
              src={MINT_PLACEHOLDER}
              className="w-full h-full object-cover"
              alt="Mint Placeholder"
            />
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ border: '1px solid #3a3a3a' }}
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-lg text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ border: '1px solid #3a3a3a' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #2a2a2a' }} />

            {/* Total */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="dash-label">Total Amount</span>
                <span className="text-2xl font-black text-white mt-1">
                  {ethPrice
                    ? `$${Math.ceil(totalPrice * ethPrice).toLocaleString('en-US')}`
                    : `${totalPrice.toFixed(3)} ETH`
                  }
                </span>
                <span className="text-dash-muted text-xs mt-0.5">{totalPrice.toFixed(3)} ETH</span>
              </div>
            </div>

            {/* Mint button */}
            {!account ? (
              <ConnectButton
                client={client}
                chain={chain}
                theme="dark"
                connectButton={{
                  className: "!w-full !py-3 !bg-ohnahji-pink !text-white !border-0 !rounded-xl !font-bold !text-base !h-auto !transition-all hover:!opacity-85",
                  label: "Connect Wallet"
                }}
              />
            ) : (
              <button
                onClick={handleMint}
                disabled={isPending}
                className="dash-btn w-full py-3 text-base font-bold rounded-xl pulse-mint"
              >
                {isPending ? 'Minting…' : 'Mint Now'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Slide2Mint
