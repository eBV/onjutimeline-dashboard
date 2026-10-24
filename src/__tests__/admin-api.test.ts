import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
// @ts-expect-error plain JS API modules have no type declarations
import { MemoryStore, __setStoreForTests } from '../../api/_store.js'
// @ts-expect-error plain JS API modules have no type declarations
import { signInMessage, SESSION_COOKIE, hashToken } from '../../api/_session.js'
// @ts-expect-error plain JS API modules have no type declarations
import { ADMIN_ADDRESSES } from '../../api/_admin.js'
// @ts-expect-error plain JS API modules have no type declarations
import { DEFAULT_CONFIG } from '../../api/_config.js'
// @ts-expect-error plain JS API modules have no type declarations
import authHandler from '../../api/auth.js'
// @ts-expect-error plain JS API modules have no type declarations
import adminConfigHandler from '../../api/admin/config.js'
// @ts-expect-error plain JS API modules have no type declarations
import siteConfigHandler from '../../api/site-config.js'

const ADMIN = ADMIN_ADDRESSES[0]
expect(ADMIN).toBe('0x64a15b1d2de581097cb48e5d82619203e24bb3e1')

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

const req = (method: string, body?: any, cookie?: string) => ({
  method,
  headers: cookie ? { cookie } : {},
  body,
  query: {},
})

let store: any
beforeEach(() => {
  store = new MemoryStore()
  __setStoreForTests(store)
})

// A session for an arbitrary address, seeded directly into the store.
// (The sign-in handler itself is covered end-to-end by quotes-api tests
// with real signatures; here the subject is admin authz, not sign-in.)
const seedSession = async (address: string) => {
  const token = `qa-token-${address.slice(2, 10)}`
  await store.setSession(hashToken(token), { address: address.toLowerCase(), exp: Date.now() + 60_000 })
  return `${SESSION_COOKIE}=${token}`
}

const signInReal = async (account: any) => {
  const signature = await account.signMessage({ message: signInMessage(account.address) })
  const res = mockRes()
  await authHandler(req('POST', { address: account.address, signature }), res)
  expect(res.statusCode).toBe(200)
  return (res.headers['set-cookie'] as string).split(';')[0]
}

describe('GET /api/admin/config authz', () => {
  test('no session is a 401', async () => {
    const res = mockRes()
    await adminConfigHandler(req('GET'), res)
    expect(res.statusCode).toBe(401)
    expect(res.body.code).toBe('SIGN_IN_REQUIRED')
  })

  test('a non-admin session is a 403', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const cookie = await signInReal(account)
    const res = mockRes()
    await adminConfigHandler(req('GET', undefined, cookie), res)
    expect(res.statusCode).toBe(403)
    expect(res.body.code).toBe('NOT_ADMIN')
  })

  test('an admin session gets a 200 with the stored config (null before any save)', async () => {
    const cookie = await seedSession(ADMIN)
    const res = mockRes()
    await adminConfigHandler(req('GET', undefined, cookie), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.config).toBeNull()
    expect(res.body.storage).toBe('memory')
  })

  test('an expired admin session is a 401', async () => {
    await store.setSession(hashToken('stale'), { address: ADMIN, exp: Date.now() - 1000 })
    const res = mockRes()
    await adminConfigHandler(req('GET', undefined, `${SESSION_COOKIE}=stale`), res)
    expect(res.statusCode).toBe(401)
  })
})

describe('PUT /api/admin/config', () => {
  test('no session is a 401 and a non-admin session is a 403', async () => {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    const noSession = mockRes()
    await adminConfigHandler(req('PUT', cfg), noSession)
    expect(noSession.statusCode).toBe(401)

    const account = privateKeyToAccount(generatePrivateKey())
    const cookie = await signInReal(account)
    const notAdmin = mockRes()
    await adminConfigHandler(req('PUT', cfg, cookie), notAdmin)
    expect(notAdmin.statusCode).toBe(403)
    expect(await store.getSiteConfig()).toBeNull()
  })

  test('a valid PUT stores the normalized config and the public endpoint serves it merged', async () => {
    const cookie = await seedSession(ADMIN)
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    cfg.slides['/story'].visible = false
    cfg.slides['/quotes'].hex = '#123456'
    cfg.features.quotesVoting = false

    const putRes = mockRes()
    await adminConfigHandler(req('PUT', cfg, cookie), putRes)
    expect(putRes.statusCode).toBe(200)
    expect(putRes.body.storage).toBe('memory')
    expect(putRes.body.config.slides['/story'].visible).toBe(false)
    expect(putRes.body.config.slides['/quotes'].hex).toBe('#123456')

    const storedRes = mockRes()
    await adminConfigHandler(req('GET', undefined, cookie), storedRes)
    expect(storedRes.statusCode).toBe(200)
    expect(storedRes.body.config.slides['/story'].visible).toBe(false)

    const publicRes = mockRes()
    await siteConfigHandler(req('GET'), publicRes)
    expect(publicRes.statusCode).toBe(200)
    expect(publicRes.body.storage).toBe('memory')
    expect(publicRes.body.config.slides['/story'].visible).toBe(false)
    expect(publicRes.body.config.slides['/quotes'].hex).toBe('#123456')
    expect(publicRes.body.config.features.quotesVoting).toBe(false)
    expect(publicRes.headers['cache-control']).toContain('s-maxage=60')
  })

  test('the hero slide is forced visible on save even if the body hides it', async () => {
    const cookie = await seedSession(ADMIN)
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    cfg.slides['/'].visible = false
    const res = mockRes()
    await adminConfigHandler(req('PUT', cfg, cookie), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.config.slides['/'].visible).toBe(true)
  })

  test('invalid bodies are rejected with details and nothing is stored', async () => {
    const cookie = await seedSession(ADMIN)
    const badHex = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    badHex.slides['/story'].hex = 'gold'
    const res1 = mockRes()
    await adminConfigHandler(req('PUT', badHex, cookie), res1)
    expect(res1.statusCode).toBe(400)
    expect(res1.body.details.join(' ')).toMatch(/hex/)

    const unknownSlide = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    unknownSlide.slides['/admin'] = { visible: true, hex: '#000000' }
    const res2 = mockRes()
    await adminConfigHandler(req('PUT', unknownSlide, cookie), res2)
    expect(res2.statusCode).toBe(400)

    const unknownFeature = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    unknownFeature.features.darkMode = true
    const res3 = mockRes()
    await adminConfigHandler(req('PUT', unknownFeature, cookie), res3)
    expect(res3.statusCode).toBe(400)

    expect(await store.getSiteConfig()).toBeNull()
  })

  test('unsupported methods are a 405', async () => {
    const cookie = await seedSession(ADMIN)
    const res = mockRes()
    await adminConfigHandler(req('DELETE', undefined, cookie), res)
    expect(res.statusCode).toBe(405)
  })
})

describe('GET /api/site-config resilience', () => {
  test('with nothing stored it serves the defaults and the honest storage mode', async () => {
    const res = mockRes()
    await siteConfigHandler(req('GET'), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.config).toEqual(DEFAULT_CONFIG)
    expect(res.body.storage).toBe('memory')
  })
})
