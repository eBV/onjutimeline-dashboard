import { parseAbi } from 'viem'

// Muralith on Highlight: verified facts and pure helpers for the native
// mint tab. Every onchain/Highlight fact here was verified 2026-10-24
// against primary sources before any mint code was written; see
// MURALITH_REPORT.md for the full verification trail.
//
// Chain: Ethereum mainnet (1).
// Contract: 0xc73EC73b53EcF64EF88D5EBCaBaB9A5f666e6ecc, an ERC721 proxy
// (implementation 0x54003072...DA9057178, ERC721GenerativeOnchain,
// source-verified on Etherscan). Its mint functions are minter-gated
// (NotMinter otherwise), so a public mint CANNOT call the collection
// contract directly: the mint goes through Highlight's sale claim API,
// which returns the transaction for the registered minter contract.
// Registered minter (read live via minters()): 0x1bf979282181f2b7a640d17aB5D2e25125F2de5e.
// Sale (Highlight collection endpoint, public): FIXED_PRICE, status
// Live, not paused, PUBLIC access, 0.001 ETH price, 0.0008 ETH Highlight
// mint fee, no per-transaction / per-wallet / total caps (all 0).
// Supply (chain reads): totalSupply 2, limitSupply 0 (open edition).
// Owner/creator: 0x64A15b1D2DE581097CB48e5D82619203E24BB3e1 (ohnahji.eth).

export const MURALITH_HIGHLIGHT_ID = '019fe9c3-17b8-7044-a6df-938f55516bca'
export const MURALITH_COLLECTION_REF = '1:0xc73ec73b53ecf64ef88d5ebcabab9a5f666e6ecc:0'
export const MURALITH_CONTRACT = '0xc73EC73b53EcF64EF88D5EBCaBaB9A5f666e6ecc'
export const MURALITH_CHAIN_ID = 1
export const MURALITH_SALE_ID = '019fe9c8-16ab-777f-92f5-cba22a129591'
export const MURALITH_HIGHLIGHT_API = 'https://api.highlight.xyz'
export const MURALITH_HIGHLIGHT_URL = `https://highlight.xyz/mint/${MURALITH_HIGHLIGHT_ID}`
export const MURALITH_ETHERSCAN_URL = `https://etherscan.io/address/${MURALITH_CONTRACT}`
export const MURALITH_OG_IMAGE =
  'https://assets.highlight.xyz/522bfaa2-5912-8ca1-9ad6-91501681cd1a?v=og-v1'

// Sale economics, in wei, from the public Highlight sale object.
export const MURALITH_PRICE_WEI = 1000000000000000n // 0.001 ETH
export const MURALITH_FEE_WEI = 800000000000000n // 0.0008 ETH Highlight mint fee
export const MURALITH_TOTAL_PER_MINT_WEI = MURALITH_PRICE_WEI + MURALITH_FEE_WEI

export const MURALITH_DESCRIPTION =
  'Muralith by Ohnahji crops a single deterministic window from an endless wall where strobe, bass pressure and torn flyers have sedimented into plaster. No two cuts are alike; each is sealed by its mint hash and ranked on a true percentile scale, so the top stays the top forever.'

// Minimal ABI for the chain reads the tab performs (totalSupply,
// limitSupply, minters). Parsed via viem so readContract calls are
// typed. The full verified ABI lives on Etherscan.
export const MURALITH_READ_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function limitSupply() view returns (uint256)',
  'function minters() view returns (address[])',
])

export interface MuralithSaleInfo {
  saleId: string
  status: string
  lifecycle: string
  paused: boolean
  accessMode: string
  priceWei: bigint
  feeWei: bigint
  minted: number
  maxPerWallet: number
  maxPerTransaction: number
  maxTotal: number
}

export const MURALITH_FALLBACK_SALE: MuralithSaleInfo = {
  saleId: MURALITH_SALE_ID,
  status: 'Live',
  lifecycle: 'Live',
  paused: false,
  accessMode: 'PUBLIC',
  priceWei: MURALITH_PRICE_WEI,
  feeWei: MURALITH_FEE_WEI,
  minted: 2,
  maxPerWallet: 0,
  maxPerTransaction: 0,
  maxTotal: 0,
}

// The sale is open when Highlight reports it Live, unpaused, and public.
export const isSaleOpen = (sale: MuralithSaleInfo): boolean =>
  sale.status === 'Live' && sale.lifecycle === 'Live' && !sale.paused && sale.accessMode === 'PUBLIC'

// Parse the public Highlight collection object into sale info. Throws
// on a shape we do not recognise, so the tab shows a read error instead
// of minting against numbers it guessed.
export const parseHighlightCollection = (json: unknown): MuralithSaleInfo => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Unexpected Highlight response shape')
  }
  const c = json as { sales?: unknown; stats?: unknown }
  if (!Array.isArray(c.sales) || c.sales.length === 0) {
    throw new Error('No sale on this Highlight collection')
  }
  const sale = c.sales[0] as Record<string, unknown>
  const currency = sale.currency as { symbol?: unknown; mintFee?: unknown } | undefined
  const price = sale.price
  if (typeof price !== 'string' || !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error('Sale price is not a decimal string')
  }
  const [whole, frac = ''] = price.split('.')
  const priceWei = BigInt(whole) * 10n ** 18n + BigInt((frac + '0'.repeat(18)).slice(0, 18) || '0')
  const feeRaw = currency?.mintFee
  const feeWei =
    typeof feeRaw === 'string' && /^\d+(\.\d+)?$/.test(feeRaw)
      ? (() => {
          const [w, f = ''] = feeRaw.split('.')
          return BigInt(w) * 10n ** 18n + BigInt((f + '0'.repeat(18)).slice(0, 18) || '0')
        })()
      : MURALITH_FEE_WEI
  const stats = sale.stats as { minted?: unknown } | undefined
  const minted = typeof stats?.minted === 'number' ? stats.minted : 0
  const num = (v: unknown): number => (typeof v === 'number' ? v : 0)
  return {
    saleId: typeof sale.id === 'string' ? sale.id : MURALITH_SALE_ID,
    status: typeof sale.status === 'string' ? sale.status : 'Unknown',
    lifecycle: typeof sale.lifecycle === 'string' ? sale.lifecycle : 'Unknown',
    paused: sale.paused === true,
    accessMode: typeof sale.accessMode === 'string' ? sale.accessMode : 'Unknown',
    priceWei,
    feeWei,
    minted,
    maxPerWallet: num(sale.maxPerWallet),
    maxPerTransaction: num(sale.maxPerTransaction),
    maxTotal: num(sale.maxTotal),
  }
}

export const expectedTotalWei = (amount: number, sale: MuralithSaleInfo): bigint =>
  BigInt(amount) * (sale.priceWei + sale.feeWei)

// Format wei as a short ETH decimal (up to 4 places, trailing zeros cut).
export const formatEth = (wei: bigint): string => {
  const whole = wei / 10n ** 18n
  const frac = (wei % 10n ** 18n).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : `${whole}`
}

// EIP-4361 (SIWE) message, built exactly the way Highlight's own auth
// runtime builds it: domain is the site's host, uri is the site's
// origin, chain 1, version 1, statement "Sign in to Highlight.".
// The nonce endpoint also returns issuedAt/expiresAt; both are carried
// so the message matches the nonce's 10-minute window.
export const buildSiweMessage = (opts: {
  address: string
  domain: string
  uri: string
  nonce: string
  issuedAt?: string
  expiresAt?: string
}): string => {
  const lines = [
    `${opts.domain} wants you to sign in with your Ethereum account:`,
    opts.address,
    '',
    'Sign in to Highlight.',
    '',
    `URI: ${opts.uri}`,
    'Version: 1',
    `Chain ID: ${MURALITH_CHAIN_ID}`,
    `Nonce: ${opts.nonce}`,
  ]
  if (opts.issuedAt) lines.push(`Issued At: ${opts.issuedAt}`)
  if (opts.expiresAt) lines.push(`Expiration Time: ${opts.expiresAt}`)
  return lines.join('\n')
}

export interface ClaimTx {
  to: string
  data: string
  value: bigint
  chainId: number
}

// Normalize a Highlight claim response into a transaction request.
// The frontend passes claim data straight to its wallet send call and
// reads chainId off it, so the shape is { to, data, value, chainId };
// a nested { transaction: {...} } wrapper is accepted defensively.
export const parseClaimTx = (json: unknown): ClaimTx => {
  const body = json as { data?: unknown } | null
  const raw = (body?.data ?? json) as Record<string, unknown>
  const tx = (raw.transaction ?? raw) as Record<string, unknown>
  if (typeof tx.to !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(tx.to)) {
    throw new Error('Claim did not return a destination address')
  }
  if (typeof tx.data !== 'string' || !/^0x[0-9a-fA-F]*$/.test(tx.data) || tx.data === '0x') {
    throw new Error('Claim did not return transaction data')
  }
  const valueRaw = tx.value
  const value =
    typeof valueRaw === 'bigint'
      ? valueRaw
      : typeof valueRaw === 'number'
        ? BigInt(valueRaw)
        : typeof valueRaw === 'string' && /^0x[0-9a-fA-F]+$/.test(valueRaw)
          ? BigInt(valueRaw)
          : typeof valueRaw === 'string' && /^\d+$/.test(valueRaw)
            ? BigInt(valueRaw)
            : null
  if (value === null) throw new Error('Claim did not return a transaction value')
  const chainId = typeof tx.chainId === 'number' ? tx.chainId : MURALITH_CHAIN_ID
  return { to: tx.to, data: tx.data, value, chainId }
}

// The safety gate before any wallet confirmation: the claim transaction
// must target a live registered minter of the Muralith contract, on
// mainnet, carrying exactly the advertised price plus fee. Anything
// else is refused with a plain-language reason, and no signature is
// ever requested for it.
export const validateClaimTx = (
  tx: ClaimTx,
  opts: { minters: string[]; amount: number; sale: MuralithSaleInfo },
): string | null => {
  if (tx.chainId !== MURALITH_CHAIN_ID) {
    return `This mint is for Ethereum mainnet, but the claim came back for chain ${tx.chainId}.`
  }
  const to = tx.to.toLowerCase()
  if (!opts.minters.some((m) => m.toLowerCase() === to)) {
    return 'The claim transaction does not target a registered Muralith minter, so it was refused.'
  }
  const expected = expectedTotalWei(opts.amount, opts.sale)
  if (tx.value !== expected) {
    return `The claim total (${formatEth(tx.value)} ETH) does not match the advertised ${formatEth(expected)} ETH for ${opts.amount} mint${opts.amount === 1 ? '' : 's'}, so it was refused.`
  }
  return null
}

export const shortAddress = (addr: string): string =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr
