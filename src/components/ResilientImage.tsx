import { useEffect, useRef, useState } from 'react'
import { ipfsUrls, ipfsAttemptPlan, placeholderImage } from '../lib/ipfs'
import { probeImage } from '../lib/imageProbe'

interface ResilientImageProps {
  cid: string
  /** Object path inside the CID, e.g. "2372.png" */
  path: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  /** Text for the last-resort placeholder, e.g. "OHNAHJI #2372" */
  placeholderText: string
  /** Ask gateways for CORS-enabled loads first (enables canvas sampling);
   *  falls back to a plain load per gateway if CORS blocks it. */
  cors?: boolean
  onArtLoad?: (img: HTMLImageElement) => void
}

const RETRY_DELAY_MS = 600
/** Delay between full-chain retry rounds after a placeholder is shown.
 *  A tile that exhausted every gateway is never terminal pink: it keeps
 *  re-probing in the background and swaps to real art if a later round
 *  succeeds. */
const RETRY_ROUND_DELAY_MS = 10000
const MAX_RETRY_ROUNDS = 2

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Image that loads IPFS art through the resilient gateway chain
 * (src/lib/ipfs.ts): probes run through a shared concurrency pool so a
 * 60-tile grid cannot 429-storm the leading gateway (wave 3), each
 * attempt carries a timeout so a hung gateway cannot park a tile, and
 * an exhausted tile shows the placeholder while retry rounds continue
 * in the background instead of staying pink forever. While loading it
 * renders a transparent image so layout never jumps.
 */
const ResilientImage = ({
  cid,
  path,
  alt,
  className,
  loading = 'lazy',
  placeholderText,
  cors = false,
  onArtLoad,
}: ResilientImageProps) => {
  const [src, setSrc] = useState<string | null>(null)
  const [winnerCors, setWinnerCors] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const onArtLoadRef = useRef(onArtLoad)
  onArtLoadRef.current = onArtLoad

  useEffect(() => {
    let cancelled = false
    setSrc(null)
    setExhausted(false)

    const urls = ipfsUrls(cid, path)
    const plan = ipfsAttemptPlan(urls.length)
    // With cors, each gateway is tried CORS-first, then plain: a gateway
    // without Access-Control-Allow-Origin fails the CORS load but can
    // still serve the art (canvas sampling then just no-ops upstream).
    const attempts: { url: string; cors: boolean }[] = []
    for (const g of plan) {
      attempts.push({ url: urls[g], cors })
      if (cors) attempts.push({ url: urls[g], cors: false })
    }
    const seenPerUrl = new Map<string, number>()

    const runChain = async (): Promise<{ url: string; cors: boolean } | null> => {
      for (let index = 0; index < attempts.length; index++) {
        if (cancelled) return null
        const { url, cors: useCors } = attempts[index]
        const seen = seenPerUrl.get(url) ?? 0
        seenPerUrl.set(url, seen + 1)
        // A repeat of the same URL needs a cache buster or the browser may
        // replay the cached failure without a real retry.
        const effectiveUrl = seen === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}retry=${seen}`
        // Back off before repeating a URL that already failed once.
        if (seen > 0) await sleep(RETRY_DELAY_MS * seen)
        if (cancelled) return null
        const ok = await probeImage(effectiveUrl, { cors: useCors })
        if (cancelled) return null
        if (ok) return { url: effectiveUrl, cors: useCors }
      }
      return null
    }

    const run = async () => {
      for (let round = 0; round <= MAX_RETRY_ROUNDS; round++) {
        if (cancelled) return
        if (round > 0) await sleep(RETRY_ROUND_DELAY_MS)
        if (cancelled) return
        const winner = await runChain()
        if (cancelled) return
        if (winner) {
          // A later round can rescue a tile that was already showing the
          // placeholder; the rendered img's onLoad then fires real art.
          // The rendered img only carries crossOrigin when the winner
          // did, so canvas sampling upstream stays correct.
          setWinnerCors(winner.cors)
          setSrc(winner.url)
          setExhausted(false)
          return
        }
        // Show the placeholder after the first exhausted chain, but keep
        // retrying in the background on later rounds instead of stopping.
        setExhausted(true)
        setSrc(placeholderImage(placeholderText))
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [cid, path, cors, placeholderText])

  return (
    <img
      src={src ?? undefined}
      alt={alt}
      className={className}
      loading={loading}
      crossOrigin={cors && winnerCors ? 'anonymous' : undefined}
      data-ipfs-exhausted={exhausted ? 'true' : undefined}
      onLoad={(e) => {
        if (!exhausted) onArtLoadRef.current?.(e.currentTarget)
      }}
    />
  )
}

export default ResilientImage
