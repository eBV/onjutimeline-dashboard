import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { copyLines, useSlideSettings } from '../../lib/siteConfig'
import { FAQ_SECTIONS } from './faqData'

// FAQ: one open answer at a time, so a long reference page never turns
// into an endless scroll. All answers start collapsed; the QA pass
// opens one to prove the motion. S-curve easing on every animation.
const SlideFaq = () => {
  const { copy, weight } = useSlideSettings('/faq')
  const copyClass = weight ? ' slide-copy' : ''
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="min-h-full flex-none flex flex-col items-center pt-24 pb-8 md:py-8">
      <div className="max-w-5xl w-full my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="neo-card bg-ohnahji-white p-6 md:p-10 rounded-[3.5rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-ohnahji-pink/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-0" />

          <div className="relative z-10 text-center mb-8 md:mb-10">
            <h2 className={`text-[40px] md:text-5xl font-black text-ohnahji-burgundy mb-4${copyClass}`}>
              {copyLines(copy.heading).map((line, i) => (
                <span key={i}>
                  {line}
                  {i < copyLines(copy.heading).length - 1 && <br />}
                </span>
              ))}
            </h2>
            <p className={`text-xl text-ohnahji-burgundy/70 max-w-xl mx-auto${copyClass}`}>{copy.paragraph}</p>
          </div>

          <div className="relative z-10 flex flex-col gap-8 md:gap-10">
            {FAQ_SECTIONS.map((section) => (
              <section key={section.title} aria-label={section.title}>
                <p className="inline-block bg-ohnahji-black text-ohnahji-white text-xs font-black tracking-widest px-4 py-2 rounded-full mb-4">
                  {section.title.toUpperCase()}
                </p>
                <div className="flex flex-col">
                  {section.items.map((item) => {
                    const id = `${section.title}:${item.q}`
                    const open = openId === id
                    return (
                      <div key={id} className="border-b-[3px] border-ohnahji-burgundy/10 last:border-b-0">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? null : id)}
                          className="w-full flex items-center justify-between gap-4 text-left py-4 md:py-5"
                        >
                          <span className="text-lg md:text-xl font-black text-ohnahji-burgundy leading-snug">
                            {item.q}
                          </span>
                          <motion.span
                            animate={{ rotate: open ? 45 : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-none w-8 h-8 flex items-center justify-center rounded-full bg-ohnahji-pink text-ohnahji-white text-xl font-black leading-none"
                            aria-hidden="true"
                          >
                            +
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <p className="text-base md:text-lg text-ohnahji-burgundy/70 leading-snug pb-5 pr-10">
                                {item.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="relative z-10 text-center mt-8 md:mt-10">
            <p className="text-base md:text-lg text-ohnahji-burgundy/70 mb-4">Still stuck? Ask live on stream.</p>
            <a
              href="https://twitch.tv/ohnahji"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-ohnahji-pink text-ohnahji-white font-black text-sm px-5 py-3 rounded-xl border-[3px] border-ohnahji-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              WATCH LIVE
            </a>
          </div>
        </motion.div>

        {/* Trailing room: a real element, not padding, per the
            2026-10-24 wave lesson on this column flex scroller. */}
        <div aria-hidden="true" className="flex-none h-40" />
      </div>
    </div>
  )
}

export default SlideFaq
