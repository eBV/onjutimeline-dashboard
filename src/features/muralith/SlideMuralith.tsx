import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSendTransaction } from 'thirdweb/react'
import { prepareTransaction } from 'thirdweb'
import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { useStore } from '../../hooks/useStore'
import { copyLines, useSlideSettings } from '../../lib/siteConfig'
import {
  MURALITH_CHAIN_ID,
  MURALITH_CONTRACT,
  MURALITH_ETHERSCAN_URL,
  MURALITH_HIGHLIGHT_API,
  MURALITH_HIGHLIGHT_ID,
  MURALITH_HIGHLIGHT_URL,
  MURALITH_OG_IMAGE,
  MURALITH_READ_ABI,
  MURALITH_SALE_ID,
  buildSiweMessage,
  expectedTotalWei,
  formatEth,
  isSaleOpen,
  parseClaimTx,
  parseHighlightCollection,
  shortAddress,
  validateClaimTx,
  type ClaimTx,
  type MuralithSaleInfo,
} from '../../lib/muralith'

// Native Muralith mint tab.
//
// How a mint works here (verified against Highlight's own frontend and
// API, 2026-10-24): the Muralith contract's mint functions are
// minter-gated, so the public cannot call the contract directly. The
// mint goes through Highlight's sale claim API: sign in to Highlight
// with a free SIWE signature, POST a claim for the sale, and submit
// the transaction Highlight returns. Before any wallet confirmation,
// the claim transaction is checked against live chain state: it must
// target a registered Muralith minter, on mainnet, carrying exactly
// the advertised price plus fee. Anything else is refused and no
// signature is requested for it. No transaction is ever sent from
// this tab without the owner's explicit confirm step.

const RPC_URL = 'https://ethereum-rpc.publicnode.com'

const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC_URL) })

interface ChainState {
  totalSupply: bigint
  limitSupply: bigint
  minters: string[]
}

const fetchSale = async (): Promise<MuralithSaleInfo> => {
  const res = await fetch(`${MURALITH_HIGHLIGHT_API}/collection/${MURALITH_HIGHLIGHT_ID}`)
  if (!res.ok) throw new Error(`Highlight answered ${res.status}`)
  return parseHighlightCollection(await res.json())
}

const fetchChainState = async (): Promise<ChainState> => {
  const [totalSupply, limitSupply, minters] = await Promise.all([
    publicClient.readContract({ address: MURALITH_CONTRACT, abi: MURALITH_READ_ABI, functionName: 'totalSupply' }),
    publicClient.readContract({ address: MURALITH_CONTRACT, abi: MURALITH_READ_ABI, functionName: 'limitSupply' }),
    publicClient.readContract({ address: MURALITH_CONTRACT, abi: MURALITH_READ_ABI, functionName: 'minters' }),
  ])
  return { totalSupply, limitSupply, minters: [...minters] }
}

type Phase =
  | 'idle'
  | 'highlight-signing'
  | 'claiming'
  | 'confirming'
  | 'sending'
  | 'submitted'
  | 'done'
  | 'error'

const SlideMuralith = () => {
  const [quantity, setQuantity] = useState(1)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const [pendingTx, setPendingTx] = useState<ClaimTx | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const account = useActiveAccount()
  const walletChain = useActiveWalletChain()
  const { client, chain } = useStore()
  // Admin panel copy registry (v2): heading, paragraph, and weight for
  // this slide; defaults mirror the literals the slide shipped with.
  const { copy, weight } = useSlideSettings('/muralith')
  const copyClass = weight ? ' slide-copy' : ''
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction()

  const saleQuery = useQuery({ queryKey: ['muralith-sale'], queryFn: fetchSale, staleTime: 60_000, retry: 1, refetchOnWindowFocus: false })
  const chainQuery = useQuery({ queryKey: ['muralith-chain'], queryFn: fetchChainState, staleTime: 60_000, retry: 1, refetchOnWindowFocus: false })

  const sale = saleQuery.data
  const chainState = chainQuery.data
  const saleOpen = sale ? isSaleOpen(sale) : false
  const wrongChain = !!account && walletChain?.id !== MURALITH_CHAIN_ID
  const qtyCap = sale && sale.maxPerTransaction > 0 ? Math.min(10, sale.maxPerTransaction) : 10
  const totalWei = sale ? expectedTotalWei(quantity, sale) : 0n

  const fail = (message: string) => {
    setError(message)
    setPhase('error')
  }

  const handleHighlightSignIn = async () => {
    if (!account) return
    setError(null)
    setPhase('highlight-signing')
    try {
      const nonceRes = await fetch(`${MURALITH_HIGHLIGHT_API}/user/signin/siwe/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const nonceJson = await nonceRes.json()
      const nonce = nonceJson?.nonce as string | undefined
      if (!nonce) throw new Error('Highlight did not return a sign-in nonce.')
      const message = buildSiweMessage({
        address: account.address,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        issuedAt: nonceJson?.issuedAt,
        expiresAt: nonceJson?.expiresAt,
      })
      const signature = await account.signMessage({ message })
      const verifyRes = await fetch(`${MURALITH_HIGHLIGHT_API}/user/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerType: 'Siwe', message, signature }),
      })
      const verifyJson = await verifyRes.json()
      const token = verifyJson?.data?.tokens?.accessToken as string | undefined
      if (!verifyRes.ok || !token) {
        throw new Error('Highlight did not accept the sign-in. Your wallet signature was still free and moved no funds.')
      }
      setHighlightToken(token)
      setPhase('idle')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Highlight sign-in failed.')
    }
  }

  const handleClaim = async () => {
    if (!account || !highlightToken || !sale || !chainState) return
    setError(null)
    setPhase('claiming')
    try {
      const claimRes = await fetch(`${MURALITH_HIGHLIGHT_API}/collection/${MURALITH_HIGHLIGHT_ID}/sales/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${highlightToken}` },
        body: JSON.stringify({ saleId: sale.saleId, amount: quantity }),
      })
      const claimJson = await claimRes.json()
      if (!claimRes.ok) {
        const msg = claimJson?.error?.message || claimJson?.message || `Highlight claim answered ${claimRes.status}.`
        throw new Error(typeof msg === 'string' ? msg : 'Highlight claim failed.')
      }
      const tx = parseClaimTx(claimJson)
      const refusal = validateClaimTx(tx, { minters: chainState.minters, amount: quantity, sale })
      if (refusal) throw new Error(refusal)
      setPendingTx(tx)
      setPhase('confirming')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Could not prepare the mint transaction.')
    }
  }

  const handleConfirmSend = () => {
    if (!pendingTx || !account) return
    setError(null)
    setPhase('sending')
    const transaction = prepareTransaction({
      client,
      chain,
      to: pendingTx.to,
      data: pendingTx.data as `0x${string}`,
      value: pendingTx.value,
    })
    sendTransaction(transaction, {
      onSuccess: (result) => {
        const hash = result.transactionHash
        setTxHash(hash)
        setPhase('submitted')
        // Best-effort bookkeeping so Highlight's reveal page can find
        // this mint; a failure here never blocks the confirmed mint.
        if (highlightToken) {
          fetch(`${MURALITH_HIGHLIGHT_API}/tx/${MURALITH_CHAIN_ID}/${hash}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${highlightToken}` },
            body: '{}',
          }).catch(() => undefined)
        }
        publicClient
          .waitForTransactionReceipt({ hash: hash as `0x${string}` })
          .then(() => setPhase('done'))
          .catch(() => setPhase('done'))
      },
      onError: (e) => {
        fail(e instanceof Error ? e.message : 'The wallet rejected or failed the transaction.')
      },
    })
  }

  const resetFlow = () => {
    setPhase('idle')
    setError(null)
    setPendingTx(null)
    setTxHash(null)
  }

  const mintBlockedReason = !sale
    ? saleQuery.isError
      ? 'Live sale data is unavailable right now, so minting is paused here. The Highlight page below still works.'
      : 'Loading the live sale…'
    : !saleOpen
      ? 'This sale is not open right now.'
      : !chainState
        ? chainQuery.isError
          ? 'The minter check could not be verified onchain, so minting is paused here for safety.'
          : 'Verifying the minter onchain…'
        : wrongChain
          ? 'Switch your wallet to Ethereum mainnet to mint.'
          : null

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl">
            <span className="text-sm font-bold">GENERATIVE SERIES ON HIGHLIGHT</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-white leading-none${copyClass}`}>
            {copyLines(copy.heading).map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p className={`text-xl text-ohnahji-white font-bold max-w-md${copyClass}`}>
            {copyLines(copy.paragraph).map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={MURALITH_HIGHLIGHT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-ohnahji-white text-ohnahji-black px-5 py-3 border-[6px] border-ohnahji-black rounded-2xl font-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
            >
              VIEW ON HIGHLIGHT
            </a>
            <a
              href={MURALITH_ETHERSCAN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-ohnahji-black text-ohnahji-gold px-5 py-3 border-[6px] border-ohnahji-gold rounded-2xl font-black hover:opacity-90 transition-all"
            >
              CONTRACT {shortAddress(MURALITH_CONTRACT)}
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="neo-card p-4 md:p-6 bg-ohnahji-white rounded-3xl"
        >
          <div className="h-28 md:h-36 bg-ohnahji-burgundy mb-4 border-[6px] border-ohnahji-black rounded-2xl flex items-center justify-center overflow-hidden">
            <img
              src={MURALITH_OG_IMAGE}
              alt="Muralith artwork"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-black text-ohnahji-burgundy text-xs uppercase tracking-widest">Sale status</span>
              {sale ? (
                <span
                  className={`px-3 py-1 border-4 border-ohnahji-black rounded-full text-xs font-black ${
                    saleOpen ? 'bg-ohnahji-gold text-ohnahji-black' : 'bg-ohnahji-black text-ohnahji-white'
                  }`}
                >
                  {saleOpen ? 'LIVE' : `${sale.status.toUpperCase()}${sale.paused ? ' / PAUSED' : ''}`}
                </span>
              ) : (
                <span className="text-sm font-bold">{saleQuery.isError ? 'UNAVAILABLE' : 'LOADING…'}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border-4 border-ohnahji-black rounded-2xl py-2">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Price</div>
                <div className="font-black text-lg">{sale ? `${formatEth(sale.priceWei)} ETH` : '—'}</div>
              </div>
              <div className="border-4 border-ohnahji-black rounded-2xl py-2">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Highlight fee</div>
                <div className="font-black text-lg">{sale ? `${formatEth(sale.feeWei)} ETH` : '—'}</div>
              </div>
              <div className="border-4 border-ohnahji-black rounded-2xl py-2">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Minted</div>
                <div className="font-black text-lg">
                  {chainState ? `${chainState.totalSupply.toString()}` : sale ? `${sale.minted}` : '—'}
                  {chainState && chainState.limitSupply === 0n ? ' / open' : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Quantity</span>
              <div className="flex items-center gap-4">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-ohnahji-pink text-ohnahji-white border-[6px] border-ohnahji-black shadow-neo rounded-full flex items-center justify-center font-bold text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-2xl">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(Math.min(qtyCap, quantity + 1))}
                  className="w-12 h-12 bg-ohnahji-pink text-ohnahji-white border-[6px] border-ohnahji-black shadow-neo rounded-full flex items-center justify-center font-bold text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t-[6px] border-ohnahji-black">
              <div className="flex flex-col">
                <span className="font-black text-ohnahji-burgundy text-xs uppercase tracking-widest opacity-60">Total amount</span>
                <span className="text-3xl font-black">{sale ? `${formatEth(totalWei)} ETH` : '— ETH'}</span>
              </div>
              <span className="text-xs font-bold opacity-60 text-right max-w-[140px]">Price plus Highlight fee, before network gas</span>
            </div>

            {phase === 'confirming' && pendingTx && sale ? (
              <div className="border-4 border-ohnahji-black rounded-2xl p-4 bg-ohnahji-gold/30 space-y-3" role="status">
                <p className="font-black">Confirm this exact mint</p>
                <p className="text-sm font-bold">
                  {quantity} × Muralith to your wallet {shortAddress(account?.address ?? '')} for {formatEth(pendingTx.value)} ETH
                  plus network gas. The transaction targets the registered Muralith minter and was checked onchain before this
                  prompt.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmSend}
                    disabled={isSending}
                    className="flex-1 py-3 bg-ohnahji-gold text-ohnahji-black border-[6px] border-ohnahji-black shadow-neo font-black rounded-2xl hover:shadow-neo-lg active:shadow-neo-active transition-all disabled:opacity-60"
                  >
                    {isSending ? 'WAITING FOR WALLET…' : 'CONFIRM MINT'}
                  </button>
                  <button
                    onClick={resetFlow}
                    className="py-3 px-5 bg-ohnahji-white text-ohnahji-black border-[6px] border-ohnahji-black font-black rounded-2xl hover:opacity-90 transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : phase === 'submitted' || phase === 'done' ? (
              <div className="border-4 border-ohnahji-black rounded-2xl p-4 bg-ohnahji-gold/30 space-y-3" role="status">
                <p className="font-black">{phase === 'done' ? 'Mint confirmed' : 'Transaction submitted'}</p>
                {txHash && (
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-black underline"
                    >
                      View transaction on Etherscan
                    </a>
                    <a
                      href={`https://highlight.xyz/mint/${MURALITH_HIGHLIGHT_ID}/reveal/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-black underline"
                    >
                      Reveal on Highlight
                    </a>
                  </div>
                )}
                <button
                  onClick={resetFlow}
                  className="py-2 px-5 bg-ohnahji-white text-ohnahji-black border-[6px] border-ohnahji-black font-black rounded-2xl hover:opacity-90 transition-all"
                >
                  MINT MORE
                </button>
              </div>
            ) : !account ? (
              <ConnectButton
                client={client}
                chain={chain}
                theme="light"
                connectButton={{
                  className:
                    '!w-full !py-4 !bg-ohnahji-gold !text-ohnahji-black !border-[6px] !border-ohnahji-black !rounded-2xl !font-black !shadow-neo hover:!shadow-neo-lg active:!shadow-neo-active !transition-all !text-xl !h-auto !border-solid',
                  label: 'CONNECT WALLET',
                }}
              />
            ) : !highlightToken ? (
              <div className="space-y-3">
                <button
                  onClick={handleHighlightSignIn}
                  disabled={!!mintBlockedReason || phase === 'highlight-signing'}
                  className="w-full py-4 bg-ohnahji-gold text-ohnahji-black border-[6px] border-ohnahji-black shadow-neo text-2xl font-black rounded-2xl hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-neo-active transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
                >
                  {phase === 'highlight-signing' ? 'SIGNING IN…' : 'SIGN IN TO HIGHLIGHT'}
                </button>
                <p className="text-xs font-bold opacity-60">
                  One free signature that only authorizes this mint claim; it moves no funds. Minting itself is a second,
                  separate wallet confirmation.
                </p>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={!!mintBlockedReason || phase === 'claiming'}
                className="w-full py-4 bg-ohnahji-gold text-ohnahji-black border-[6px] border-ohnahji-black shadow-neo text-2xl font-black rounded-2xl hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-x-[4px] active:translate-y-[4px] active:shadow-neo-active transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
              >
                {phase === 'claiming' ? 'PREPARING MINT…' : 'MINT NOW'}
              </button>
            )}

            {mintBlockedReason && phase !== 'error' && (
              <p className="text-sm font-bold text-center mt-4" role="status">
                {mintBlockedReason}
              </p>
            )}
            {phase === 'error' && error && (
              <div className="space-y-3 mt-4" role="alert">
                <p className="text-sm font-bold text-center">{error}</p>
                <button
                  onClick={resetFlow}
                  className="w-full py-2 bg-ohnahji-white text-ohnahji-black border-[6px] border-ohnahji-black font-black rounded-2xl hover:opacity-90 transition-all"
                >
                  TRY AGAIN
                </button>
                <a
                  href={MURALITH_HIGHLIGHT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center font-black underline"
                >
                  Or mint directly on Highlight
                </a>
              </div>
            )}
            <p className="text-xs font-bold opacity-60 text-center mt-4">
              Sale {MURALITH_SALE_ID.slice(0, 8)}… · Contract {shortAddress(MURALITH_CONTRACT)} · No per-wallet cap
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SlideMuralith
