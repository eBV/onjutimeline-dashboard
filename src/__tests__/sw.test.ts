import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

const SW_SOURCE = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')

interface FakeResponse {
  body: string
  clone: () => FakeResponse
}
const fakeResponse = (body: string): FakeResponse => ({
  body,
  clone: () => fakeResponse(body),
})

interface Harness {
  listeners: Record<string, (...args: never[]) => unknown>
  fetchCalls: string[]
  fetchShouldFail: boolean
  cacheStore: Map<string, Map<string, FakeResponse>>
  claimed: boolean
}

function loadWorker(): Harness {
  const listeners: Record<string, (...args: never[]) => unknown> = {}
  const fetchCalls: string[] = []
  const cacheStore = new Map<string, Map<string, FakeResponse>>()
  const harness: Harness = {
    listeners,
    fetchCalls,
    fetchShouldFail: false,
    cacheStore,
    claimed: false,
  }
  const cacheFor = (name: string) => {
    if (!cacheStore.has(name)) cacheStore.set(name, new Map())
    const store = cacheStore.get(name)!
    return {
      match: async (req: { url: string } | string) => {
        const key = typeof req === 'string' ? req : req.url
        return store.get(key) ?? store.get('/index.html') ?? undefined
      },
      put: async (req: { url: string } | string, res: FakeResponse) => {
        store.set(typeof req === 'string' ? req : req.url, res)
      },
      addAll: async (urls: string[]) => {
        for (const u of urls) store.set(u, fakeResponse(`shell:${u}`))
      },
    }
  }
  const sandbox = {
    location: { origin: 'https://example.test' },
    addEventListener: (type: string, fn: (...args: never[]) => unknown) => {
      listeners[type] = fn
    },
    clients: {
      claim: async () => {
        harness.claimed = true
      },
    },
    caches: {
      open: async (name: string) => cacheFor(name),
      keys: async () => [...cacheStore.keys()],
      delete: async (name: string) => cacheStore.delete(name),
      match: async (req: { url: string } | string) => {
        const key = typeof req === 'string' ? req : req.url
        for (const store of cacheStore.values()) {
          const hit = store.get(key)
          if (hit) return hit
        }
        return undefined
      },
    },
    fetch: async (req: { url: string } | string) => {
      const url = typeof req === 'string' ? req : req.url
      fetchCalls.push(url)
      if (harness.fetchShouldFail) throw new Error('offline')
      return fakeResponse(`network:${url}`)
    },
    URL,
    Promise,
  }
  // `self` inside the worker script must be the sandbox itself.
  const context = { ...sandbox, self: null as unknown }
  context.self = context
  runInNewContext(SW_SOURCE, context)
  return harness
}

function fireFetch(
  h: Harness,
  request: { url: string; method?: string; mode?: string },
) {
  let response: Promise<unknown> | null = null
  const event = {
    request: { method: 'GET', mode: 'cors', ...request },
    respondWith: (p: Promise<unknown>) => {
      response = p
    },
  }
  ;(h.listeners.fetch as (e: unknown) => void)(event)
  return response as unknown as Promise<FakeResponse> | null
}

describe('service worker', () => {
  it('registers install, activate, and fetch handlers', () => {
    const h = loadWorker()
    expect(Object.keys(h.listeners).sort()).toEqual([
      'activate',
      'fetch',
      'install',
    ])
  })

  it('precaches the app shell on install', async () => {
    const h = loadWorker()
    let done: Promise<unknown> | undefined
    ;(h.listeners.install as (e: { waitUntil: (p: Promise<unknown>) => void }) => void)({
      waitUntil: (p) => {
        done = p
      },
    })
    await done
    const shell = h.cacheStore.get('ohnahji-shell-v1')!
    expect(shell.has('/')).toBe(true)
    expect(shell.has('/index.html')).toBe(true)
    expect(shell.has('/manifest.json')).toBe(true)
  })

  it('never intercepts API or third-party requests', () => {
    const h = loadWorker()
    expect(
      fireFetch(h, { url: 'https://example.test/api/quotes' }),
    ).toBeNull()
    expect(
      fireFetch(h, { url: 'https://ethereum-rpc.publicnode.com' }),
    ).toBeNull()
    expect(
      fireFetch(h, { url: 'https://highlight.xyz/mint/x' }),
    ).toBeNull()
    expect(h.fetchCalls).toEqual([])
  })

  it('never intercepts non-GET requests', () => {
    const h = loadWorker()
    expect(
      fireFetch(h, { url: 'https://example.test/api/vote', method: 'POST' }),
    ).toBeNull()
  })

  it('serves navigations network-first with the cached shell offline', async () => {
    const h = loadWorker()
    const shell = new Map([[ '/index.html', fakeResponse('shell') ]])
    h.cacheStore.set('ohnahji-shell-v1', shell)
    const online = await fireFetch(h, {
      url: 'https://example.test/muralith',
      mode: 'navigate',
    })
    expect((online as FakeResponse).body).toContain('network:')
    h.fetchShouldFail = true
    const offline = await fireFetch(h, {
      url: 'https://example.test/muralith',
      mode: 'navigate',
    })
    expect((offline as FakeResponse).body).toBe('shell')
  })

  it('serves hashed assets cache-first and fills the cache on miss', async () => {
    const h = loadWorker()
    const asset = 'https://example.test/assets/index-abc123.js'
    const cached = fakeResponse('cached-asset')
    h.cacheStore.set(
      'ohnahji-shell-v1',
      new Map([[asset, cached]]),
    )
    const hit = await fireFetch(h, { url: asset })
    expect((hit as FakeResponse).body).toBe('cached-asset')
    expect(h.fetchCalls).toEqual([])

    const h2 = loadWorker()
    const miss = await fireFetch(h2, { url: asset })
    expect((miss as FakeResponse).body).toContain('network:')
    expect(h2.cacheStore.get('ohnahji-shell-v1')!.has(asset)).toBe(true)
  })

  it('cleans old caches and claims clients on activate', async () => {
    const h = loadWorker()
    h.cacheStore.set('ohnahji-shell-v0', new Map())
    let done: Promise<unknown> | undefined
    ;(h.listeners.activate as (e: { waitUntil: (p: Promise<unknown>) => void }) => void)({
      waitUntil: (p) => {
        done = p
      },
    })
    await done
    expect(h.cacheStore.has('ohnahji-shell-v0')).toBe(false)
    expect(h.claimed).toBe(true)
  })

  it('does not call skipWaiting anywhere', () => {
    expect(SW_SOURCE).not.toContain('skipWaiting(')
  })
})
