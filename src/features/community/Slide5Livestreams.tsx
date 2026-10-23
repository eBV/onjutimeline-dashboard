import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

// Live status, VODs and clips come from the /api/twitch serverless function
// (Helix via an app token held server-side). When it reports unavailable or
// the fetch fails, the slide simply keeps the embed and schedule copy.
interface TwitchFeed {
  live: boolean
  stream: { title: string; viewerCount: number; thumbnailUrl: string; startedAt: string } | null
  videos: { title: string; url: string; thumbnailUrl: string; duration: string; viewCount: number; createdAt: string }[]
  clips: { title: string; url: string; thumbnailUrl: string; viewCount: number }[]
  nextStream: { title: string; startTime: string } | null
  unavailable?: boolean
}

const fetchTwitchFeed = async (): Promise<TwitchFeed> => {
  const response = await fetch('/api/twitch')
  if (!response.ok) throw new Error(`twitch feed responded ${response.status}`)
  return response.json()
}

const formatStart = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

const Slide5Livestreams = () => {
  const [activeTab, setActiveTab] = useState<'twitch' | 'youtube'>('twitch')

  const { data: feed } = useQuery({
    queryKey: ['twitch-feed'],
    queryFn: fetchTwitchFeed,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  })
  const feedReady = feed && !feed.unavailable

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold font-sans">LIVE CONTENT</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-white mb-4">
            Livestream era
          </h1>
          <p className="text-xl text-ohnahji-gold font-bold font-sans">
            Watch live on Twitch and YouTube
          </p>
        </motion.div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('twitch')}
            className={`px-8 py-4 border-[6px] font-black text-xl transition-all rounded-2xl font-sans ${activeTab === 'twitch'
              ? 'bg-purple-600 text-white border-ohnahji-black shadow-neo-lg'
              : 'bg-ohnahji-burgundy text-ohnahji-white border-ohnahji-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
          >
            TWITCH
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-8 py-4 border-[6px] font-black text-xl transition-all rounded-2xl font-sans ${activeTab === 'youtube'
              ? 'bg-ohnahji-gold text-ohnahji-black border-ohnahji-black shadow-neo-lg'
              : 'bg-ohnahji-burgundy text-ohnahji-white border-ohnahji-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
          >
            Youtube
          </button>
        </div>

        {activeTab === 'twitch' && feedReady && (
          <div className="mb-6 flex justify-center">
            {feed.live && feed.stream ? (
              <div className="inline-flex items-center gap-3 bg-ohnahji-black text-ohnahji-white px-5 py-3 border-[4px] border-ohnahji-gold rounded-full max-w-full">
                <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full animate-pulse shrink-0">LIVE</span>
                <span className="font-black text-sm truncate">{feed.stream.title}</span>
                <span className="text-ohnahji-gold font-bold text-xs shrink-0">{feed.stream.viewerCount} watching</span>
              </div>
            ) : feed.nextStream ? (
              <p className="text-ohnahji-white font-bold text-center">
                OFFLINE · NEXT STREAM: <span className="text-ohnahji-gold">{feed.nextStream.title}</span> · {formatStart(feed.nextStream.startTime)}
              </p>
            ) : (
              <p className="text-ohnahji-white font-bold text-center">OFFLINE · CATCH THE NEXT ONE LIVE</p>
            )}
          </div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="video-container aspect-video bg-ohnahji-burgundy rounded-3xl overflow-hidden border-[6px] border-ohnahji-black"
        >
          {activeTab === 'twitch' ? (
            <iframe
              src={`https://player.twitch.tv/?channel=ohnahji&parent=${window.location.hostname}&muted=true`}
              style={{ border: 'none' }}
              allowFullScreen
              title="Twitch Stream"
              className="w-full h-full"
            />
          ) : (
            <iframe
              src="https://www.youtube.com/embed/live_stream?channel=UC2jADEyzHMKOA9KuywmKqDQ"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Channel"
              className="w-full h-full"
            />
          )}
        </motion.div>

        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-center text-ohnahji-white font-bold font-sans">
            {activeTab === 'twitch' ? 'twitch.tv/ohnahji' : 'youtube.com/@ohnahji/streams'}
          </p>
          {activeTab === 'youtube' && (
            <a
              href="https://www.youtube.com/@ohnahji/streams"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-ohnahji-gold text-ohnahji-black px-5 py-2 border-[4px] border-ohnahji-black rounded-full font-black text-xs shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-sans"
            >
              OPEN ON YOUTUBE ↗
            </a>
          )}
        </div>

        {activeTab === 'twitch' && feedReady && feed.videos.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-black text-ohnahji-white mb-4">LATEST BROADCASTS</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {feed.videos.map((video) => (
                <a
                  key={video.url}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-60 shrink-0 bg-ohnahji-burgundy border-[4px] border-ohnahji-black rounded-2xl overflow-hidden shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all"
                >
                  <div className="aspect-video bg-ohnahji-black overflow-hidden">
                    <img src={video.thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-black text-sm text-ohnahji-white leading-tight line-clamp-2">{video.title}</p>
                    <p className="text-[11px] font-bold text-ohnahji-gold mt-1">{video.duration} · {video.viewCount.toLocaleString()} views</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'twitch' && feedReady && feed.clips.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-black text-ohnahji-white mb-4">TOP CLIPS</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {feed.clips.map((clip) => (
                <a
                  key={clip.url}
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-60 shrink-0 bg-ohnahji-burgundy border-[4px] border-ohnahji-black rounded-2xl overflow-hidden shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all"
                >
                  <div className="aspect-video bg-ohnahji-black overflow-hidden">
                    <img src={clip.thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-black text-sm text-ohnahji-white leading-tight line-clamp-2">{clip.title}</p>
                    <p className="text-[11px] font-bold text-ohnahji-gold mt-1">{clip.viewCount.toLocaleString()} views</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Slide5Livestreams
