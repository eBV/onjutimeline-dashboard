import { motion } from 'framer-motion'
import { Twitter, Instagram, MessageCircle, Youtube, Twitch } from 'lucide-react'
import { CONTRACT_ADDRESS } from '../../lib/constants'

const Slide6Socials = () => {
  const web2Socials = [
    { name: 'Discord', link: 'https://discord.com/invite/3ahyqHkhc7', icon: <MessageCircle size={28} />, color: 'bg-[#5865F2]' },
    { name: 'Twitter', link: 'https://twitter.com/ohnahji', icon: <Twitter size={28} />, color: 'bg-[#1DA1F2]' },
    { name: 'Instagram', link: 'https://instagram.com/ohnahji', icon: <Instagram size={28} />, color: 'bg-[#E1306C]' },
    { name: 'YouTube', link: 'https://youtube.com/@ohnahji', icon: <Youtube size={28} />, color: 'bg-[#FF0000]' },
    { name: 'Twitch', link: 'https://twitch.tv/ohnahji', icon: <Twitch size={28} />, color: 'bg-[#9146FF]' },
    { name: 'Farcaster', link: 'https://farcaster.xyz/ohnahji', icon: <span className="text-2xl font-black">⬡</span>, color: 'bg-[#8A63D2]' },
  ]

  const web3Socials = [
    { name: 'OpenSea', link: 'https://opensea.io/collection/ohnahji', icon: '🌊', color: 'bg-[#2081E2]' },
    { name: 'Etherscan', link: `https://etherscan.io/address/${CONTRACT_ADDRESS}`, icon: '🔍', color: 'bg-[#21325E]' },
  ]

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="neo-card bg-ohnahji-white p-6 md:p-12 rounded-[3.5rem] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-ohnahji-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-0" />

          <div className="relative z-10 text-center mb-12">
            <h2 className="text-5xl font-black text-ohnahji-burgundy mb-4">Join the community</h2>
            <p className="text-xl text-ohnahji-burgundy/70 max-w-xl mx-auto">
              Follow us across the web and stay updated on the latest in emerging tech.
            </p>
          </div>

          <div className="relative z-10">
            {/* Social links grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {[...web2Socials, ...web3Socials].map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className={`${social.color} p-3 flex flex-col items-center gap-1.5 rounded-2xl border-[4px] border-ohnahji-black shadow-neo hover:shadow-neo-lg transition-all text-white`}
                >
                  <span>{social.icon}</span>
                  <span className="font-bold text-xs tracking-wide font-sans text-center leading-tight">{social.name}</span>
                </motion.a>
              ))}
            </div>

            {/* CTA section */}
            <div className="flex flex-col gap-4 p-4 md:p-6 bg-ohnahji-burgundy rounded-[2rem] border-[6px] border-ohnahji-black shadow-neo text-white">
              <div>
                <h3 className="text-2xl font-black text-ohnahji-gold">Become a member</h3>
                <p className="font-bold text-ohnahji-white/80 font-sans text-sm">Exclusive access to our community and events.</p>
              </div>
              <a
                href="https://discord.com/invite/3ahyqHkhc7"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-ohnahji-pink text-white border-[6px] border-ohnahji-black shadow-neo hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all text-center font-black text-lg rounded-2xl font-sans neo-button-flood"
              >
                Join Discord
              </a>
            </div>
          </div>
        </motion.div>

        {/* Trust kit: anti-phishing line. Only official links live here. */}
        <p className="mt-6 text-center text-ohnahji-black font-bold text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto px-2">
          Ohnahji will never DM you first, ask for your seed phrase, or ask you to approve unknown contracts. Official links live only on this site.
        </p>
      </div>
    </div>
  )
}

export default Slide6Socials
