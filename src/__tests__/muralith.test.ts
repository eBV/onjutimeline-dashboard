// Unit tests for the Muralith mint tab's pure logic. No transaction is
// sent here; the mint path itself is covered by stubbed browser QA.
import {
  MURALITH_CONTRACT,
  MURALITH_FEE_WEI,
  MURALITH_PRICE_WEI,
  MURALITH_TOTAL_PER_MINT_WEI,
  buildSiweMessage,
  expectedTotalWei,
  formatEth,
  isSaleOpen,
  parseClaimTx,
  parseHighlightCollection,
  validateClaimTx,
  MURALITH_FALLBACK_SALE,
} from '../lib/muralith'
import { BASE_SLIDES, GATED_SLIDES } from '../lib/deck'
import { DEFAULT_SITE_CONFIG } from '../lib/siteConfig'

const goodTx = () => ({
  to: '0x1bf979282181f2b7a640d17aB5D2e25125F2de5e',
  data: '0x1234abcd',
  value: MURALITH_TOTAL_PER_MINT_WEI,
  chainId: 1,
})

const minters = ['0x1bf979282181f2b7a640d17aB5D2e25125F2de5e']

describe('verified contract facts', () => {
  test('contract address and economics match the verified sources', () => {
    expect(MURALITH_CONTRACT).toBe('0xc73EC73b53EcF64EF88D5EBCaBaB9A5f666e6ecc')
    expect(MURALITH_PRICE_WEI).toBe(1000000000000000n)
    expect(MURALITH_FEE_WEI).toBe(800000000000000n)
    expect(MURALITH_TOTAL_PER_MINT_WEI).toBe(1800000000000000n)
    expect(formatEth(MURALITH_TOTAL_PER_MINT_WEI)).toBe('0.0018')
  })

  test('deck registration: Muralith sits after Socials, before the gated pair', () => {
    const basePaths = BASE_SLIDES.map((s) => s.path)
    expect(basePaths.indexOf('/muralith')).toBe(basePaths.indexOf('/socials') + 1)
    expect(GATED_SLIDES.map((s) => s.path)).toEqual(['/vault', '/firstlook'])
    expect(DEFAULT_SITE_CONFIG.slides['/muralith']).toMatchObject({ visible: true, hex: '#FE517E', gate: 'public', weight: null })
    expect(DEFAULT_SITE_CONFIG.slides['/muralith'].copy.heading).toBe('Muralith\nmint')
  })
})

describe('Highlight collection parsing', () => {
  // Trimmed live fixture from GET /collection/019fe9c3-... (2026-10-24).
  const fixture = {
    highlightId: '019fe9c3-17b8-7044-a6df-938f55516bca',
    name: 'Muralith',
    sales: [
      {
        id: '019fe9c8-16ab-777f-92f5-cba22a129591',
        type: 'FIXED_PRICE',
        price: '0.001',
        currency: { symbol: 'ETH', decimals: 18, type: 'NATIVE', mintFee: '0.0008' },
        maxPerTransaction: 0,
        maxPerWallet: 0,
        maxTotal: 0,
        accessMode: 'PUBLIC',
        status: 'Live',
        paused: false,
        lifecycle: 'Live',
        stats: { minted: 2 },
      },
    ],
    stats: { tokenCount: 2 },
  }

  test('parses the live sale shape', () => {
    const sale = parseHighlightCollection(fixture)
    expect(sale.saleId).toBe('019fe9c8-16ab-777f-92f5-cba22a129591')
    expect(sale.priceWei).toBe(1000000000000000n)
    expect(sale.feeWei).toBe(800000000000000n)
    expect(sale.minted).toBe(2)
    expect(isSaleOpen(sale)).toBe(true)
    expect(expectedTotalWei(3, sale)).toBe(5400000000000000n)
  })

  test('paused or non-public sales are not open', () => {
    expect(isSaleOpen({ ...MURALITH_FALLBACK_SALE, paused: true })).toBe(false)
    expect(isSaleOpen({ ...MURALITH_FALLBACK_SALE, accessMode: 'ALLOWLIST' })).toBe(false)
    expect(isSaleOpen({ ...MURALITH_FALLBACK_SALE, status: 'Ended' })).toBe(false)
  })

  test('malformed shapes throw instead of guessing', () => {
    expect(() => parseHighlightCollection(null)).toThrow()
    expect(() => parseHighlightCollection({ sales: [] })).toThrow()
    expect(() => parseHighlightCollection({ sales: [{ price: 'free' }] })).toThrow()
  })
})

describe('SIWE message', () => {
  test('matches EIP-4361 with Highlight statement, domain, and window', () => {
    const msg = buildSiweMessage({
      address: '0x64A15b1D2DE581097CB48e5D82619203E24BB3e1',
      domain: 'ohnahji-timeline.vercel.app',
      uri: 'https://ohnahji-timeline.vercel.app',
      nonce: 'abcdef0123456789',
      issuedAt: '2026-10-24T15:27:43.342Z',
      expiresAt: '2026-10-24T15:37:43.342Z',
    })
    expect(msg).toBe(
      [
        'ohnahji-timeline.vercel.app wants you to sign in with your Ethereum account:',
        '0x64A15b1D2DE581097CB48e5D82619203E24BB3e1',
        '',
        'Sign in to Highlight.',
        '',
        'URI: https://ohnahji-timeline.vercel.app',
        'Version: 1',
        'Chain ID: 1',
        'Nonce: abcdef0123456789',
        'Issued At: 2026-10-24T15:27:43.342Z',
        'Expiration Time: 2026-10-24T15:37:43.342Z',
      ].join('\n'),
    )
  })
})

describe('claim transaction validation (the safety gate)', () => {
  test('a correct claim passes', () => {
    expect(validateClaimTx(goodTx(), { minters, amount: 1, sale: MURALITH_FALLBACK_SALE })).toBeNull()
  })

  test('wrong chain is refused', () => {
    expect(validateClaimTx({ ...goodTx(), chainId: 8453 }, { minters, amount: 1, sale: MURALITH_FALLBACK_SALE })).toMatch(
      /mainnet/,
    )
  })

  test('a destination that is not a registered minter is refused', () => {
    expect(
      validateClaimTx({ ...goodTx(), to: '0x000000000000000000000000000000000000dEaD' }, { minters, amount: 1, sale: MURALITH_FALLBACK_SALE }),
    ).toMatch(/registered Muralith minter/)
  })

  test('a value that does not match price plus fee is refused', () => {
    expect(
      validateClaimTx({ ...goodTx(), value: 1000000000000000n }, { minters, amount: 1, sale: MURALITH_FALLBACK_SALE }),
    ).toMatch(/does not match/)
  })

  test('multi-mint totals scale with quantity', () => {
    const tx = { ...goodTx(), value: 3n * MURALITH_TOTAL_PER_MINT_WEI }
    expect(validateClaimTx(tx, { minters, amount: 3, sale: MURALITH_FALLBACK_SALE })).toBeNull()
    expect(validateClaimTx(tx, { minters, amount: 2, sale: MURALITH_FALLBACK_SALE })).not.toBeNull()
  })

  test('claim parsing accepts the data envelope and rejects empty calldata', () => {
    expect(parseClaimTx({ data: goodTx() })).toEqual(goodTx())
    expect(parseClaimTx({ data: { transaction: goodTx() } })).toEqual(goodTx())
    expect(() => parseClaimTx({ data: { ...goodTx(), data: '0x' } })).toThrow()
    expect(() => parseClaimTx({ data: { ...goodTx(), to: 'not-an-address' } })).toThrow()
    expect(() => parseClaimTx({ data: { ...goodTx(), value: '0.0018' } })).toThrow()
  })
})
