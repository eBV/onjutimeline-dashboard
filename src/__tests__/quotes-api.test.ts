import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
// @ts-expect-error plain JS API modules have no type declarations
import { voteDeltas, applyDeltas, isDirection } from '../../api/_votes.js'
// @ts-expect-error plain JS API modules have no type declarations
import { MemoryStore, __setStoreForTests } from '../../api/_store.js'
// @ts-expect-error plain JS API modules have no type declarations
import { signInMessage, SESSION_COOKIE } from '../../api/_session.js'
// @ts-expect-error plain JS API modules have no type declarations
import authHandler from '../../api/auth.js'
// @ts-expect-error plain JS API modules have no type declarations
import voteHandler from '../../api/vote.js'
// @ts-expect-error plain JS API modules have no type declarations
import quotesHandler from '../../api/quotes.js'

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

const post = (body: any, cookie?: string) => ({
  method: 'POST',
  headers: cookie ? { cookie } : {},
  body,
  query: {},
})

const signIn = async (account: any) => {
  const signature = await account.signMessage({ message: signInMessage(account.address) })
  const res = mockRes()
  await authHandler(post({ address: account.address, signature }), res)
  return res
}

const sessionCookie = (res: any) => {
  const header = res.headers['set-cookie']
  expect(header).toContain(SESSION_COOKIE)
  return header.split(';')[0]
}

beforeEach(() => {
  __setStoreForTests(new MemoryStore())
})

describe('vote delta math', () => {
  test('fresh upvote and downvote', () => {
    expect(voteDeltas(0, 1)).toEqual({ upDelta: 1, downDelta: 0 })
    expect(voteDeltas(0, -1)).toEqual({ upDelta: 0, downDelta: 1 })
  })

  test('switching sides moves both counters', () => {
    expect(voteDeltas(1, -1)).toEqual({ upDelta: -1, downDelta: 1 })
    expect(voteDeltas(-1, 1)).toEqual({ upDelta: 1, downDelta: -1 })
  })

  test('retracting clears the old counter only', () => {
    expect(voteDeltas(1, 0)).toEqual({ upDelta: -1, downDelta: 0 })
    expect(voteDeltas(-1, 0)).toEqual({ upDelta: 0, downDelta: -1 })
  })

  test('repeating the same vote is a no-op, counts never go negative', () => {
    expect(voteDeltas(1, 1)).toEqual({ upDelta: 0, downDelta: 0 })
    expect(applyDeltas({ up: 0, down: 0 }, { upDelta: -1, downDelta: -1 })).toEqual({ up: 0, down: 0 })
    expect(isDirection(2)).toBe(false)
    expect(isDirection(1)).toBe(true)
  })
})

describe('auth handler', () => {
  test('a valid signature over the canonical message issues a session', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const res = await signIn(account)
    expect(res.statusCode).toBe(200)
    expect(res.body.address).toBe(account.address.toLowerCase())
    sessionCookie(res)
  })

  test('a signature from a different wallet is rejected', async () => {
    const signer = privateKeyToAccount(generatePrivateKey())
    const claimed = privateKeyToAccount(generatePrivateKey())
    const signature = await signer.signMessage({ message: signInMessage(claimed.address) })
    const res = mockRes()
    await authHandler(post({ address: claimed.address, signature }), res)
    expect(res.statusCode).toBe(401)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  test('a signature over a tampered message is rejected', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const other = privateKeyToAccount(generatePrivateKey())
    // Signed the message naming a different wallet, claims this one.
    const signature = await account.signMessage({ message: signInMessage(other.address) })
    const res = mockRes()
    await authHandler(post({ address: account.address, signature }), res)
    expect(res.statusCode).toBe(401)
  })

  test('missing or malformed fields are rejected', async () => {
    const res = mockRes()
    await authHandler(post({ address: 'not-an-address', signature: '0x12' }), res)
    expect(res.statusCode).toBe(400)
  })
})

describe('vote handler', () => {
  test('forged requests without a session are rejected', async () => {
    const res = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 1 }), res)
    expect(res.statusCode).toBe(401)
    expect(res.body.code).toBe('SIGN_IN_REQUIRED')
  })

  test('a forged session token is rejected', async () => {
    const res = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 1 }, `${SESSION_COOKIE}=deadbeef`), res)
    expect(res.statusCode).toBe(401)
  })

  test('full lifecycle: upvote, switch, retract, with counts following', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const cookie = sessionCookie(await signIn(account))

    const up = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 1 }, cookie), up)
    expect(up.statusCode).toBe(200)
    expect(up.body).toMatchObject({ up: 1, down: 0, score: 1, yourVote: 1 })

    const repeat = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 1 }, cookie), repeat)
    expect(repeat.body).toMatchObject({ up: 1, down: 0, score: 1, yourVote: 1 })

    const switched = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: -1 }, cookie), switched)
    expect(switched.body).toMatchObject({ up: 0, down: 1, score: -1, yourVote: -1 })

    const retracted = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 0 }, cookie), retracted)
    expect(retracted.body).toMatchObject({ up: 0, down: 0, score: 0, yourVote: 0 })
  })

  test('one wallet cannot move another wallet\'s vote, and unknown quotes fail', async () => {
    const a = privateKeyToAccount(generatePrivateKey())
    const b = privateKeyToAccount(generatePrivateKey())
    const cookieA = sessionCookie(await signIn(a))
    const cookieB = sessionCookie(await signIn(b))

    const resA = mockRes()
    await voteHandler(post({ quoteId: 'd413-01', direction: 1 }, cookieA), resA)
    expect(resA.body.up).toBe(1)

    const resB = mockRes()
    await voteHandler(post({ quoteId: 'd413-01', direction: 1 }, cookieB), resB)
    expect(resB.body.up).toBe(2)

    const unknown = mockRes()
    await voteHandler(post({ quoteId: 'd999-99', direction: 1 }, cookieA), unknown)
    expect(unknown.statusCode).toBe(400)

    const badDirection = mockRes()
    await voteHandler(post({ quoteId: 'd413-01', direction: 5 }, cookieA), badDirection)
    expect(badDirection.statusCode).toBe(400)
  })

  test('sign-out kills the session', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const cookie = sessionCookie(await signIn(account))
    const out = mockRes()
    await authHandler(post({ action: 'signout' }, cookie), out)
    expect(out.statusCode).toBe(200)
    const res = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: 1 }, cookie), res)
    expect(res.statusCode).toBe(401)
  })
})

describe('quotes handler', () => {
  test('returns the archive with counts and the storage mode', async () => {
    const res = mockRes()
    await quotesHandler({ method: 'GET', headers: {}, query: {} }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.storage).toBe('memory')
    expect(res.body.quotes.length).toBeGreaterThan(300)
    expect(res.body.quotes[0]).toHaveProperty('score')
    expect(res.body.votes).toBeUndefined()
  })

  test('the voter variant returns that wallet\'s vote map', async () => {
    const account = privateKeyToAccount(generatePrivateKey())
    const cookie = sessionCookie(await signIn(account))
    const v = mockRes()
    await voteHandler(post({ quoteId: 'd424-01', direction: -1 }, cookie), v)
    expect(v.statusCode).toBe(200)

    const res = mockRes()
    await quotesHandler({ method: 'GET', headers: {}, query: { voter: account.address } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.votes).toEqual({ 'd424-01': -1 })
    expect(res.headers['cache-control']).toContain('no-store')
  })
})
