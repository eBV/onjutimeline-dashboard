// Twitch feed for the Live slide: stream status, latest VODs and clips,
// and the next scheduled stream for twitch.tv/ohnahji.
//
// Credentials come ONLY from the Vercel project environment
// (TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET). Nothing is hardcoded here.
// If the env vars are missing or Twitch errors, the handler still returns
// 200 with `unavailable: true` so the client degrades to the plain embed.

const BROADCASTER_ID = '907992368' // ohnahji
const CHANNEL_LOGIN = 'ohnahji'

let tokenCache = { token: null, expiresAt: 0 }

const fallback = () => ({
  live: false,
  stream: null,
  channel: { login: CHANNEL_LOGIN, id: BROADCASTER_ID },
  videos: [],
  clips: [],
  nextStream: null,
  unavailable: true,
})

async function getAppToken(clientId, clientSecret, fetchImpl) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token
  const res = await fetchImpl('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!res.ok) throw new Error(`token request failed: ${res.status}`)
  const json = await res.json()
  tokenCache = {
    token: json.access_token,
    // Refresh a minute early so an in-flight request never uses a dead token.
    expiresAt: Date.now() + Math.max(0, (json.expires_in ?? 3600) - 60) * 1000,
  }
  return tokenCache.token
}

async function helix(path, clientId, token, fetchImpl) {
  const res = await fetchImpl(`https://api.twitch.tv/helix${path}`, {
    headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`helix ${path} failed: ${res.status}`)
  return res.json()
}

// Order matters: %{width} contains {width} as a substring, so the
// percent forms must be replaced first.
const sizedThumb = (url) =>
  (url ?? '')
    .replaceAll('%{width}', '640')
    .replaceAll('%{height}', '360')
    .replaceAll('{width}', '640')
    .replaceAll('{height}', '360')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  res.setHeader('Content-Type', 'application/json')

  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return res.status(200).json(fallback())
  }

  const fetchImpl = globalThis.fetch
  try {
    const token = await getAppToken(clientId, clientSecret, fetchImpl)
    const settle = (p) => p.catch(() => null)
    const [streams, videos, clips, schedule] = await Promise.all([
      settle(helix(`/streams?user_id=${BROADCASTER_ID}`, clientId, token, fetchImpl)),
      settle(helix(`/videos?user_id=${BROADCASTER_ID}&type=archive&first=5`, clientId, token, fetchImpl)),
      settle(helix(`/clips?broadcaster_id=${BROADCASTER_ID}&first=5`, clientId, token, fetchImpl)),
      settle(helix(`/schedule?broadcaster_id=${BROADCASTER_ID}`, clientId, token, fetchImpl)),
    ])

    // Every Helix call failed; report unavailable so the client keeps the
    // plain embed instead of rendering empty feed sections.
    if (!streams && !videos && !clips && !schedule) {
      return res.status(200).json(fallback())
    }

    const streamItem = streams?.data?.[0] ?? null
    const nextSegment = schedule?.data?.segments?.[0] ?? null

    return res.status(200).json({
      live: !!streamItem,
      stream: streamItem
        ? {
            title: streamItem.title,
            viewerCount: streamItem.viewer_count,
            thumbnailUrl: sizedThumb(streamItem.thumbnail_url),
            startedAt: streamItem.started_at,
          }
        : null,
      channel: { login: CHANNEL_LOGIN, id: BROADCASTER_ID },
      videos: (videos?.data ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnailUrl: sizedThumb(v.thumbnail_url),
        duration: v.duration,
        viewCount: v.view_count,
        createdAt: v.created_at,
      })),
      clips: (clips?.data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        embedUrl: c.embed_url,
        thumbnailUrl: sizedThumb(c.thumbnail_url),
        viewCount: c.view_count,
      })),
      nextStream: nextSegment
        ? { title: nextSegment.title, startTime: nextSegment.start_time }
        : null,
    })
  } catch {
    return res.status(200).json(fallback())
  }
}
