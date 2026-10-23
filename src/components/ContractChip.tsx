import { useEffect, useRef, useState } from 'react'
import { CONTRACT_ADDRESS } from '../lib/constants'

// Trust kit: the official contract address as a copyable chip. Shows a
// truncated form of the full address; the copy button always copies the
// complete address so nobody has to trust a lookalike link.
const ContractChip = () => {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    } catch {
      // Clipboard API can be unavailable (permissions, older browsers);
      // fall back to a temporary textarea + execCommand.
      const ta = document.createElement('textarea')
      ta.value = CONTRACT_ADDRESS
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        // Nothing more we can do; the Etherscan link still verifies.
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  const truncated = `${CONTRACT_ADDRESS.slice(0, 6)}…${CONTRACT_ADDRESS.slice(-4)}`

  return (
    <div className="inline-flex items-center gap-2 bg-ohnahji-black text-ohnahji-white pl-4 pr-2 py-2 border-[4px] border-ohnahji-gold rounded-full shadow-neo-sm max-w-full">
      <span className="font-mono text-xs sm:text-sm font-bold tracking-wide" title={CONTRACT_ADDRESS}>
        {truncated}
      </span>
      <button
        onClick={copyAddress}
        className="bg-ohnahji-gold text-ohnahji-black text-[11px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
        aria-label={`Copy the full contract address ${CONTRACT_ADDRESS}`}
      >
        {copied ? 'COPIED' : 'COPY'}
      </button>
      <a
        href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ohnahji-gold text-xs font-black px-1 hover:underline"
        aria-label="View the contract on Etherscan"
      >
        ETHERSCAN ↗
      </a>
    </div>
  )
}

export default ContractChip
