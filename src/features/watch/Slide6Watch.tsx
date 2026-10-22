import { motion } from 'framer-motion'

const recentStreams = [
  { date: 'Mar 26', title: 'YwB175: HAPPY BIRTHDAY @JA…', duration: '1h0m6s', views: 63 },
  { date: 'Mar 25', title: 'YwB174: FIELD TRIP VIBIN\'…', duration: '2h42m38s', views: 84 },
  { date: 'Mar 24', title: 'YwB173: TUESDAY LATER VIBE…', duration: '1h9m28s', views: 32 },
  { date: 'Mar 23', title: 'YwB172: MONDAY CHILLIN OUT…', duration: '2h43m50s', views: 57 },
  { date: 'Mar 21', title: 'OhnahjiU: ONJUSaturdays! M…', duration: '1h49m25s', views: 44 },
]

const Slide6Watch = () => {
  return (
    <div className="min-h-full flex flex-col justify-start pt-8 pb-4 md:py-8 gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <span className="dash-badge-gold mb-3">Recorded Sessions</span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none mt-3">
            ONJU Streams
          </h1>
          <p className="text-dash-muted text-sm mt-2">Watch past livestreams &amp; sessions</p>
        </div>
        <a
          href="https://www.youtube.com/@ohnahji/streams"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-btn-outline text-xs py-2 px-4 rounded-lg hidden md:flex"
        >
          Open on YouTube ↗
        </a>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Video embed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="video-container flex-1 min-h-0"
          style={{ minHeight: '220px' }}
        >
          <iframe
            // Uploads playlist of @ohnahji (channel UC2jADEyzHMKOA9KuywmKqDQ,
            // uploads = UU + channel id minus UC). Verified live via YouTube
            // oEmbed on 2026-10-22 ("Uploads from Ohnahji University
            // Network"); the previous playlist PLvmAix5Xj5Hk... is deleted
            // (oEmbed 404, player showed "This video is unavailable").
            src="https://www.youtube.com/embed/videoseries?list=UU2jADEyzHMKOA9KuywmKqDQ&rel=0"
            className="w-full h-full"
            style={{ border: 'none', minHeight: '220px' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="ONJU Streams"
          />
        </motion.div>

        {/* Recent streams table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl overflow-hidden flex-shrink-0 md:w-64"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #2a2a2a' }}
          >
            <span className="text-white text-sm font-bold">Recent Streams</span>
          </div>
          <div className="flex flex-col">
            {recentStreams.map((stream, i) => (
              <div
                key={i}
                className="px-4 py-2.5 flex items-start justify-between gap-2"
                style={{ borderBottom: i < recentStreams.length - 1 ? '1px solid #1e1e1e' : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-dash-muted text-[10px] font-medium">{stream.date}</div>
                  <div className="text-white text-xs font-medium truncate mt-0.5">{stream.title}</div>
                  <div className="text-dash-muted text-[10px] mt-0.5">{stream.duration}</div>
                </div>
                <span className="text-ohnahji-pink text-xs font-bold flex-shrink-0">{stream.views}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Mobile open link */}
      <div className="flex md:hidden justify-center">
        <a
          href="https://www.youtube.com/@ohnahji/streams"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-btn-outline text-sm py-2 px-5 rounded-lg"
        >
          Open on YouTube ↗
        </a>
      </div>
    </div>
  )
}

export default Slide6Watch
