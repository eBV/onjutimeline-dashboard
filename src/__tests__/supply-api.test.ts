import { vi } from 'vitest'
// @ts-expect-error plain JS API module has no type declarations
import supplyHandler from '../../api/supply.js'
import { fetchTotalSupply } from '../hooks/useStore'

const mockRes = () => {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: any) {
      this.body = payload
      return this
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value
    },
  }
  return res
}

const jsonResponse = (body: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('/api/supply handler', () => {
  test('returns the live supply shape with the revealed math', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ jsonrpc: '2.0', id: 1, result: '0x13e9' })))
    const res = mockRes()
    await supplyHandler({ method: 'GET', headers: {} }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.totalSupply).toBe(5097)
    expect(res.body.revealed).toBe(5067)
    expect(res.body.maxSupply).toBe(9010)
    expect(res.body.stale).toBeUndefined()
    expect(typeof res.body.updatedAt).toBe('string')
    expect(res.headers['cache-control']).toContain('s-maxage=120')
  })

  test('falls through a failing RPC to the next one', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('publicnode')) throw new Error('down')
      return jsonResponse({ jsonrpc: '2.0', id: 1, result: '0x13ea' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = mockRes()
    await supplyHandler({ method: 'GET', headers: {} }, res)
    expect(res.body.totalSupply).toBe(5098)
    expect(res.body.revealed).toBe(5068)
    expect(fetchMock.mock.calls.length).toBe(2)
  })

  test('total RPC failure serves the last-known shape flagged stale, never an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('all down') }))
    const res = mockRes()
    await supplyHandler({ method: 'GET', headers: {} }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ totalSupply: 5097, revealed: 5067, maxSupply: 9010, stale: true })
  })
})

describe('client fetchTotalSupply', () => {
  test('prefers /api/supply when it answers', async () => {
    const fetchMock = vi.fn(async (url: any) => {
      if (String(url) === '/api/supply') return jsonResponse({ totalSupply: 5150, revealed: 5120, maxSupply: 9010 })
      throw new Error('RPC must not be called when the API answers')
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchTotalSupply()).resolves.toBe(5150)
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual(['/api/supply'])
  })

  test('falls back to the direct RPC read when the API fails', async () => {
    const fetchMock = vi.fn(async (url: any) => {
      if (String(url) === '/api/supply') return jsonResponse({}, 500)
      return jsonResponse({ jsonrpc: '2.0', id: 1, result: '0x13e9' })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchTotalSupply()).resolves.toBe(5097)
    expect(fetchMock.mock.calls).toHaveLength(2)
  })
})
