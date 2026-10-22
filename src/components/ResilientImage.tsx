import { useEffect, useRef, useState } from 'react'
import { ipfsUrls, ipfsAttemptPlan, placeholderImage } from '../lib/ipfs'

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

/**
 * Image that loads IPFS art through the resilient gateway chain
 * (src/lib/ipfs.ts): retries the leading gateway with backoff (429s are
 * transient), rotates through the rest, and only shows the placeholder
 * after every gateway and retry has failed. While loading it renders a
 * transparent image so layout never jumps.
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
  const loadedImgRef = useRef<HTMLImageElement | null>(null)
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

    const tryAttempt = (index: number) => {
      if (cancelled) return
      if (index >= attempts.length) {
        setExhausted(true)
        setSrc(placeholderImage(placeholderText))
        return
      }
      const { url, cors: useCors } = attempts[index]
      const seen = seenPerUrl.get(url) ?? 0
      seenPerUrl.set(url, seen + 1)
      // A repeat of the same URL needs a cache buster or the browser may
      // replay the cached failure without a real retry.
      const effectiveUrl = seen === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}retry=${seen}`
      const probe = new Image()
      if (useCors) probe.crossOrigin = 'anonymous'
      probe.onload = () => {
        if (cancelled) return
        loadedImgRef.current = probe
        setWinnerCors(useCors)
        setSrc(effectiveUrl)
      }
      probe.onerror = () => {
        if (cancelled) return
        window.setTimeout(() => tryAttempt(index + 1), seen === 0 ? 0 : RETRY_DELAY_MS * seen)
      }
      probe.src = effectiveUrl
    }

    tryAttempt(0)
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
