import { useState } from 'react'
import { motion } from 'framer-motion'

const Slide5Livestreams = () => {
  const [activeTab, setActiveTab] = useState<'twitch' | 'youtube'>('twitch')

  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <span className="dash-badge mb-3">Live Content</span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none mt-3">
            Livestream Era
          </h1>
          <p className="text-dash-muted text-sm mt-2">Watch live on Twitch and YouTube</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-dash-muted">
          <span className="w-2 h-2 rounded-full bg-[#444] inline-block" />
          <span>Offline</span>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 rounded-full w-fit"
        style={{ background: '#161616', border: '1px solid #2a2a2a' }}
      >
        <button
          onClick={() => setActiveTab('twitch')}
          className={`dash-tab ${activeTab === 'twitch' ? 'dash-tab-active' : ''}`}
        >
          Twitch
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`dash-tab ${activeTab === 'youtube' ? 'dash-tab-active' : ''}`}
        >
          YouTube
        </button>
      </div>

      {/* Video player */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 video-container aspect-video"
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
            src="https://www.youtube.com/embed/videoseries?list=PLvmAix5Xj5Hk2rYwg2T0H-eMXdDbqSMH9"
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Channel"
            className="w-full h-full"
          />
        )}
      </motion.div>

      {/* Footer */}
      <div
        className="flex justify-between items-center text-[11px] text-dash-muted pt-1 border-t"
        style={{ borderColor: '#2a2a2a' }}
      >
        <span>{activeTab === 'twitch' ? 'twitch.tv/ohnahji' : 'youtube.com/@ohnahji/streams'}</span>
        <span>Live from {activeTab === 'twitch' ? 'Twitch' : 'YouTube'} API</span>
      </div>
    </div>
  )
}

export default Slide5Livestreams
