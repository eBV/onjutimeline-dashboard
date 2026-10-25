// Lens feed pagination (2026-10-24). The slide used to show only the
// first page of @ohnahji.lens posts with no way to reach older ones.
// The Lens v3 posts endpoint paginates with an opaque cursor: the
// response carries pageInfo.next, and passing it back as cursor returns
// the next (older) page. Both halves were verified against the live API
// before this shipped: page 1 returns 10 posts plus a next cursor, and
// that cursor returns the following 10 older posts.

export const LENS_ACCOUNT = '0x6582D147eEb571b3B3689C42f4e5416a89F83428' // ohnahji.lens
export const LENS_API = 'https://api.lens.xyz/graphql'

export interface LensPost {
  id: string
  timestamp: string
  text: string
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string
}

export interface LensPage {
  posts: LensPost[]
  nextCursor: string | null
}

export const buildPostsQuery = (cursor?: string | null): string => {
  const cursorPart = cursor ? `, cursor: ${JSON.stringify(cursor)}` : ''
  return `
query Posts {
  posts(request: { filter: { authors: ["${LENS_ACCOUNT}"] }, pageSize: TEN${cursorPart} }) {
    items {
      __typename
      ... on Post {
        id
        timestamp
        metadata {
          __typename
          ... on TextOnlyMetadata { content }
          ... on ImageMetadata { content image { item } }
          ... on VideoMetadata { content video { item } }
          ... on AudioMetadata { content audio { item } }
          ... on ArticleMetadata { content }
        }
      }
    }
    pageInfo { next }
  }
}
`
}

// One page of the feed, newest first within the page (the API returns
// newest first; the sort is a guard, not a reorder across pages).
export const fetchLensPage = async (cursor?: string | null): Promise<LensPage> => {
  const response = await fetch(LENS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: buildPostsQuery(cursor) }),
  })
  if (!response.ok) throw new Error(`Lens API responded ${response.status}`)
  const json = await response.json()
  if (json.errors) throw new Error('Lens API returned errors')
  const items = json?.data?.posts?.items ?? []
  const posts = items
    .filter((it: any) => it && it.__typename === 'Post' && it.metadata && it.timestamp)
    .map((it: any) => ({
      id: String(it.id),
      timestamp: it.timestamp,
      text: it.metadata.content ?? '',
      imageUrl: it.metadata.image?.item,
      videoUrl: it.metadata.video?.item,
      audioUrl: it.metadata.audio?.item,
    }))
    .sort((a: LensPost, b: LensPost) => +new Date(b.timestamp) - +new Date(a.timestamp))
  const rawNext = json?.data?.posts?.pageInfo?.next
  return { posts, nextCursor: typeof rawNext === 'string' && rawNext.length > 0 ? rawNext : null }
}

// Append a fetched page below the existing feed. Order never changes:
// page 1 stays first, older pages append below in fetch order. Ids the
// feed already has (cursor overlap) are dropped, never duplicated.
export const mergeLensPage = (
  existing: LensPost[],
  page: LensPage,
): { posts: LensPost[]; nextCursor: string | null; endReached: boolean } => {
  const seen = new Set(existing.map((p) => p.id))
  const fresh = page.posts.filter((p) => !seen.has(p.id))
  return {
    posts: [...existing, ...fresh],
    nextCursor: page.nextCursor,
    endReached: page.nextCursor === null,
  }
}
