import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildPostsQuery, fetchLensPage, mergeLensPage, type LensPost } from '../features/lens/lensFeed'

const post = (id: string, timestamp: string): LensPost => ({ id, timestamp, text: `post ${id}` })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildPostsQuery', () => {
  it('omits the cursor on the first page and always asks for pageInfo.next', () => {
    const q = buildPostsQuery()
    expect(q).not.toContain('cursor:')
    expect(q).toContain('pageInfo { next }')
  })

  it('includes a JSON-escaped cursor on later pages', () => {
    const q = buildPostsQuery('abc"def')
    expect(q).toContain('cursor: "abc\\"def"')
  })
})

describe('mergeLensPage', () => {
  it('appends older posts below without reordering', () => {
    const merged = mergeLensPage(
      [post('1', '2026-10-24T10:00:00Z'), post('2', '2026-10-24T09:00:00Z')],
      { posts: [post('3', '2026-10-23T10:00:00Z')], nextCursor: 'c2' },
    )
    expect(merged.posts.map((p) => p.id)).toEqual(['1', '2', '3'])
    expect(merged.nextCursor).toBe('c2')
    expect(merged.endReached).toBe(false)
  })

  it('drops ids the feed already has and ends when next is null', () => {
    const merged = mergeLensPage(
      [post('1', '2026-10-24T10:00:00Z')],
      { posts: [post('1', '2026-10-24T10:00:00Z'), post('2', '2026-10-23T10:00:00Z')], nextCursor: null },
    )
    expect(merged.posts.map((p) => p.id)).toEqual(['1', '2'])
    expect(merged.endReached).toBe(true)
  })
})

describe('fetchLensPage', () => {
  const stubFetch = (body: unknown, ok = true) =>
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => body })))

  it('maps posts newest first and returns the next cursor', async () => {
    stubFetch({
      data: {
        posts: {
          items: [
            { __typename: 'Post', id: 'old', timestamp: '2026-10-23T10:00:00Z', metadata: { content: 'old post' } },
            { __typename: 'Post', id: 'new', timestamp: '2026-10-24T10:00:00Z', metadata: { content: 'new post' } },
            { __typename: 'Comment', id: 'x', timestamp: '2026-10-25T10:00:00Z', metadata: { content: 'not a post' } },
          ],
          pageInfo: { next: 'cursor-2' },
        },
      },
    })
    const page = await fetchLensPage()
    expect(page.posts.map((p) => p.id)).toEqual(['new', 'old'])
    expect(page.nextCursor).toBe('cursor-2')
  })

  it('treats a missing next cursor as the end of the feed', async () => {
    stubFetch({ data: { posts: { items: [], pageInfo: { next: null } } } })
    const page = await fetchLensPage('c1')
    expect(page.nextCursor).toBeNull()
    expect(page.posts).toEqual([])
  })

  it('throws on a failed response or API errors', async () => {
    stubFetch({}, false)
    await expect(fetchLensPage()).rejects.toThrow()
    stubFetch({ errors: [{ message: 'bad' }] })
    await expect(fetchLensPage()).rejects.toThrow('Lens API returned errors')
  })
})
