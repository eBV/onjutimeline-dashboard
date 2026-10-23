import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton, useActiveAccount, useSendTransaction } from 'thirdweb/react'
import { getContract, prepareContractCall, toWei } from 'thirdweb'
import { useETHPrice } from '../../hooks/useNFT'
import { useStore } from '../../hooks/useStore'

import { CONTRACT_ADDRESS, IPFS_CID_MINT_PLACEHOLDER } from '../../lib/constants'
import ResilientImage from '../../components/ResilientImage'
import ContractChip from '../../components/ContractChip'


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
    const transaction = prepareContractCall({
      contract,
      method: 'function mint(uint256 quantity) payable',
      params: [BigInt(quantity)],
      value: toWei(totalPrice.toString()),
    })
    sendTransaction(transaction)
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-block bg-ohnahji-pink text-ohnahji-white px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl">
            <span className="text-sm font-bold">Spring 2026</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-gold leading-none">
            Spring '26<br />drop
          </h1>
          <p className="text-xl text-ohnahji-white font-bold max-w-md">
            Limited edition mint. Join the revolution.
          </p>
          <div>
            <p className="font-black text-ohnahji-white text-xs uppercase tracking-widest mb-2">Official contract</p>
            <ContractChip />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="neo-card p-4 md:p-6 bg-ohnahji-white rounded-3xl"
        >
          <div className="h-44 md:h-56 bg-gradient-to-br from-ohnahji-burgundy to-ohnahji-pink mb-4 border-[6px] border-ohnahji-black rounded-2xl flex items-center justify-center overflow-hidden">
            <ResilientImage
              cid={IPFS_CID_MINT_PLACEHOLDER}
              path="NoRevealHolder.png"
              className="w-full h-full object-cover"
              alt="Mint Placeholder"
              placeholderText="OHNAHJI"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Quantity</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-ohnahji-pink text-ohnahji-white border-[6px] border-ohnahji-black shadow-neo rounded-full flex items-center justify-center font-bold text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-2xl">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-12 h-12 bg-ohnahji-pink text-ohnahji-white border-[6px] border-ohnahji-black shadow-neo rounded-full flex items-center justify-center font-bold text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 border-t-[6px] border-ohnahji-black font-sans group relative cursor-help">
              <div className="flex flex-col">
                <span className="font-black text-ohnahji-burgundy text-xs uppercase tracking-widest opacity-60">Total Amount</span>
                <span className="text-3xl font-black">
                  {ethPrice
                    ? `$${Math.ceil(totalPrice * ethPrice).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`
                    : `${totalPrice.toFixed(3)} ETH`
                  }
                </span>
              </div>

              {/* ETH Hover Popup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                whileHover={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -top-12 right-0 bg-ohnahji-black text-ohnahji-gold px-4 py-2 rounded-xl border-4 border-ohnahji-gold font-black text-sm opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-neo-sm"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase text-white/50">Network Fee Basis</span>
                  <span>{totalPrice.toFixed(3)} ETH</span>
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-ohnahji-black border-r-4 border-b-4 border-ohnahji-gold rotate-45" />
              </motion.div>
            </div>

            {!account ? (
              <ConnectButton
                client={client}
                chain={chain}
                theme="light"
                connectButton={{
                  className: "!w-full !py-4 !bg-ohnahji-gold !text-ohnahji-black !border-[6px] !border-ohnahji-black !rounded-2xl !font-black !shadow-neo hover:!shadow-neo-lg active:!shadow-neo-active !transition-all !text-xl !h-auto !border-solid",
                  label: "CONNECT WALLET"
                }}
              />
            ) : (
              <button
                onClick={handleMint}
                disabled={isPending}
                className="w-full py-4 bg-ohnahji-gold text-ohnahji-black border-[6px] border-ohnahji-black shadow-neo text-2xl font-black rounded-2xl hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-neo-active transition-all pulse-mint font-sans neo-button-flood disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
              >
                {isPending ? 'MINTING...' : 'MINT NOW'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Slide2Mint
