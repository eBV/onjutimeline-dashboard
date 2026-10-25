import { useSlideSettings } from '../../lib/siteConfig'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchLensPage, mergeLensPage, LENS_ACCOUNT, type LensPost } from './lensFeed'

// Latest posts from @ohnahji on Lens Chain, read through the public Lens
// GraphQL API (no auth or API key needed for reads). Page 1 loads with
// the slide; LOAD MORE below the feed fetches older pages through the
// API's cursor pagination and appends them (see lensFeed.ts).
// Orb profile page for @ohnahji (chosen over hey.xyz as the follow link).
const FOLLOW_URL = 'https://orb.club/@ohnahji'

const relativeTime = (iso: string): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SlideLens = () => {
  const { copy, weight } = useSlideSettings('/lens')
  const copyClass = weight ? ' slide-copy' : ''
  const { data: firstPage, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['lens-posts', LENS_ACCOUNT],
    queryFn: () => fetchLensPage(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Appended older pages. They always belong to the current first-page
  // snapshot: if page 1 refetches with new content, the extras reset
  // rather than appending stale posts under a fresh feed.
  const [extraPosts, setExtraPosts] = useState<LensPost[]>([])
  const [cursor, setCursor] = useState<string | null | undefined>(undefined)
  const [endReached, setEndReached] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const firstPageRef = useRef<typeof firstPage>(undefined)
  useEffect(() => {
    if (firstPage && firstPageRef.current !== firstPage) {
      firstPageRef.current = firstPage
      setExtraPosts([])
      setCursor(firstPage.nextCursor)
      setEndReached(firstPage.nextCursor === null)
      setLoadMoreError(false)
    }
  }, [firstPage])
  const posts = firstPage ? [...firstPage.posts, ...extraPosts] : undefined

  const loadMore = async () => {
    if (loadingMore || cursor === undefined || cursor === null) return
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const page = await fetchLensPage(cursor)
      const merged = mergeLensPage(posts ?? [], page)
      // merged.posts starts with the current feed, so the new items are
      // everything past its previous length.
      setExtraPosts(merged.posts.slice((posts ?? []).length))
      setCursor(merged.nextCursor)
      setEndReached(merged.endReached)
    } catch {
      // The existing posts stay exactly as they were; only the button
      // flips to its retry state.
      setLoadMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-[#ABFE2C] text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold">LENS CHAIN</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-white mb-4${copyClass}`}>
            {copy.heading}
          </h1>
          <p className={`text-xl text-ohnahji-gold font-bold${copyClass}`}>
            {copy.paragraph}
          </p>
          <a
            href={FOLLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 bg-ohnahji-gold text-ohnahji-black px-6 py-3 border-[6px] border-ohnahji-black rounded-full font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
          >
            FOLLOW ON LENS ↗
          </a>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-16" role="status" aria-label="Loading Lens feed">
            <p className="text-ohnahji-white text-2xl font-black animate-pulse">LOADING THE FEED...</p>
          </div>
        ) : isError ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy mb-2">Could not load the feed</p>
            <p className="font-bold text-ohnahji-burgundy/70 mb-6">
              Lens did not answer this time. Check back in a moment, or find @ohnahji.lens on Orb.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-ohnahji-pink text-ohnahji-white px-6 py-3 border-[6px] border-ohnahji-black rounded-full font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all disabled:opacity-60"
            >
              {isFetching ? 'RETRYING...' : 'RETRY'}
            </button>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy">No posts yet</p>
            <p className="font-bold text-ohnahji-burgundy/70">When @ohnahji posts on Lens, it will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 4) * 0.05 }}
                className="neo-card bg-ohnahji-white rounded-3xl p-5 md:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-ohnahji-burgundy">@ohnahji.lens</span>
                  <time className="text-xs font-bold text-ohnahji-burgundy/50" dateTime={post.timestamp}>
                    {relativeTime(post.timestamp)}
                  </time>
                </div>
                {/* Post text is rendered as a plain React text node (escaped
                    by React); never as HTML. */}
                {post.text && (
                  <p className="font-bold text-ohnahji-black whitespace-pre-wrap break-words leading-relaxed">
                    {post.text}
                  </p>
                )}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post media from @ohnahji.lens"
                    loading="lazy"
                    className="mt-4 w-full max-h-96 object-cover rounded-2xl border-[4px] border-ohnahji-black"
                  />
                )}
                {post.videoUrl && (
                  <video
                    src={post.videoUrl}
                    controls
                    preload="none"
                    className="mt-4 w-full max-h-96 rounded-2xl border-[4px] border-ohnahji-black bg-ohnahji-black"
                  />
                )}
                {post.audioUrl && (
                  <audio src={post.audioUrl} controls preload="none" className="mt-4 w-full" />
                )}
              </motion.article>
            ))}
          </div>
        )}

        {/* Paging: older posts append below, newest first, nothing
            reorders and nothing duplicates (see lensFeed.mergeLensPage).
            The button is pink with white text, matching the MINT pill. */}
        {posts && posts.length > 0 && !endReached && (
          <div className="text-center mt-6 mb-2">
            {loadMoreError && (
              <p className="text-ohnahji-white/80 font-bold text-sm mb-3">
                Could not load more posts. Your feed is untouched; try again.
              </p>
            )}
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-ohnahji-pink text-ohnahji-white px-6 py-3 border-[6px] border-ohnahji-black rounded-full font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all disabled:opacity-60"
            >
              {loadingMore ? 'LOADING...' : loadMoreError ? 'RETRY' : 'LOAD MORE'}
            </button>
          </div>
        )}
        {posts && posts.length > 0 && endReached && (
          <p className="text-center text-ohnahji-white/80 font-bold text-sm mt-6 mb-2">
            You are caught up.
          </p>
        )}
      </div>
    </div>
  )
}

export default SlideLens
