import { motion } from 'framer-motion'

const schedule = [
  { day: 'Mon', time: '8 PM', active: true },
  { day: 'Tue', time: '—', active: false },
  { day: 'Wed', time: '8 PM', active: true },
  { day: 'Thu', time: '—', active: false },
  { day: 'Fri', time: '9 PM', active: true },
  { day: 'Sat', time: '3 PM', active: true },
  { day: 'Sun', time: '—', active: false },
]

const Slide3HBCU = () => {
  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-5">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4"
        >
          <div>
            <span className="dash-badge mb-3">February 2022</span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none mt-3">
              The HBCU<br />
              <span className="text-ohnahji-pink">Pivot</span>
            </h1>
            <p className="text-dash-muted text-sm md:text-base mt-3 max-w-sm leading-relaxed">
              Education meets innovation. Building the future of creative communities in Web3.
            </p>
          </div>

          {/* Discord Campus card */}
          <div
            className="rounded-xl p-4 flex flex-col gap-4"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#5865F220', border: '1px solid #5865F240' }}
              >
                🎓
              </div>
              <div>
                <div className="text-white font-bold">Discord Campus</div>
                <div className="text-dash-muted text-xs">Virtual Learning Community</div>
              </div>
            </div>
            <a
              href="https://discord.com/invite/3ahyqHkhc7"
              target="_blank"
              rel="noopener noreferrer"
              className="dash-btn w-full py-2.5 rounded-lg text-sm font-bold"
            >
              Join Discord →
            </a>
          </div>

          {/* ONJUSaturdays card */}
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: '#141200', border: '1px solid rgba(241,196,15,0.25)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(241,196,15,0.12)', border: '1px solid rgba(241,196,15,0.3)' }}
            >
              🗓️
            </div>
            <div>
              <div className="text-white font-bold">#ONJUSaturdays</div>
              <div className="text-dash-muted text-xs">Weekly Educational Sessions</div>
            </div>
          </div>
        </motion.div>

        {/* Right column — Schedule */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base">Schedule</h3>
            <span className="dash-badge">Weekly</span>
          </div>

          <div className="flex flex-col gap-1">
            {schedule.map(({ day, time, active }) => (
              <div
                key={day}
                className="flex items-center justify-between py-2 px-1 rounded-lg"
                style={active ? {} : {}}
              >
                <span className={`text-sm font-medium ${active ? 'text-white' : 'text-dash-muted'}`}>
                  {day}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: active ? '#FE517E' : '#444' }}
                >
                  {time}
                </span>
              </div>
            ))}
          </div>

          <div
            className="pt-3 text-xs text-dash-muted border-t"
            style={{ borderColor: '#2a2a2a' }}
          >
            All times Eastern. Check Discord for updates.
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Slide3HBCU
