// Concurrency-limited image probing for IPFS art.
//
// Diagnosis (wave 3, 2026-10-25): the gallery renders 60 tiles at once
// and every ResilientImage fired its full gateway chain immediately.
// Browsers cap connections per host (6), and the burst tripped pinata's
// rate limit, so whole chains 429ed their way to the pink placeholder
// on shuffle after shuffle. Serializing probes through a small shared
// pool keeps the burst orderly: tiles fill progressively instead of
// failing together, and a slow gateway stalls one slot instead of the
// whole grid. A per-attempt timeout also stops a hung gateway from
// parking a tile forever (Image probes have no built-in timeout).

export const MAX_CONCURRENT_PROBES = 6
export const PROBE_TIMEOUT_MS = 20000

type Release = () => void

export function createImageProbeLimiter(maxConcurrent: number) {
  let running = 0
  const queue: Array<() => void> = []

  const pump = () => {
    while (running < maxConcurrent && queue.length > 0) {
      running++
      queue.shift()!()
    }
  }

  function acquire(): Promise<Release> {
    return new Promise((resolve) => {
      queue.push(() => {
        let released = false
        resolve(() => {
          if (released) return
          released = true
          running--
          pump()
        })
      })
      pump()
    })
  }

  return { acquire }
}

/** Shared pool used by every ResilientImage on the page. */
export const imageProbeLimiter = createImageProbeLimiter(MAX_CONCURRENT_PROBES)

export interface ProbeOptions {
  cors?: boolean
  timeoutMs?: number
  /** Slot pool; defaults to the shared pool. Tests inject their own. */
  limiter?: ReturnType<typeof createImageProbeLimiter>
}

/**
 * Load one image URL through the slot pool. Resolves true on load,
 * false on error or timeout. The slot is held only for the actual load,
 * never for queue waiting, and is always released on settle.
 */
export async function probeImage(
  url: string,
  { cors = false, timeoutMs = PROBE_TIMEOUT_MS, limiter = imageProbeLimiter }: ProbeOptions = {},
): Promise<boolean> {
  const release = await limiter.acquire()
  try {
    return await new Promise<boolean>((resolve) => {
      const probe = new Image()
      let settled = false
      const timer = window.setTimeout(() => {
        if (settled) return
        settled = true
        resolve(false)
      }, timeoutMs)
      const done = (ok: boolean) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        resolve(ok)
      }
      if (cors) probe.crossOrigin = 'anonymous'
      probe.onload = () => done(true)
      probe.onerror = () => done(false)
      probe.src = url
    })
  } finally {
    release()
  }
}
