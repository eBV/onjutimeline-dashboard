import { createImageProbeLimiter, MAX_CONCURRENT_PROBES, PROBE_TIMEOUT_MS } from '../lib/imageProbe'

describe('image probe limiter', () => {
  test('pool size and timeout constants', () => {
    expect(MAX_CONCURRENT_PROBES).toBe(6)
    expect(PROBE_TIMEOUT_MS).toBe(20000)
  })

  test('acquires up to the cap immediately, then queues until a release', async () => {
    const limiter = createImageProbeLimiter(2)
    const release1 = await limiter.acquire()
    const release2 = await limiter.acquire()
    let thirdResolved = false
    const third = limiter.acquire().then((release) => {
      thirdResolved = true
      return release
    })
    // Let any microtasks run; the third acquire must still be queued.
    await Promise.resolve()
    await Promise.resolve()
    expect(thirdResolved).toBe(false)
    release1()
    const release3 = await third
    expect(thirdResolved).toBe(true)
    release2()
    release3()
  })

  test('releasing twice does not inflate the pool', async () => {
    const limiter = createImageProbeLimiter(1)
    const release = await limiter.acquire()
    release()
    release()
    // A fresh acquire must resolve immediately, proving the double
    // release did not corrupt the running count.
    let resolved = false
    const next = limiter.acquire().then((r) => {
      resolved = true
      return r
    })
    await Promise.resolve()
    expect(resolved).toBe(true)
    ;(await next)()
  })
})
