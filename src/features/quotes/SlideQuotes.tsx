import { useSlideSettings } from '../../lib/siteConfig'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ConnectButton, useActiveAccount } from 'thirdweb/react'
import { OHNAHJI_WALLET_THEME } from '../../lib/walletTheme'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { SEED_QUOTES, type SeedQuote } from '../../lib/quotes'
import { useSiteConfig } from '../../lib/siteConfig'

// The Quotes board: every one-liner pick from the daily stream archive,
// ranked by community votes. Reading is public. Voting takes any
// connected wallet plus a one-time signed message (no transaction, no
// gas); after that the server session makes voting one click. See
// api/auth.js and api/vote.js.

interface QuoteWithCounts extends SeedQuote {
  up: number
  down: number
  score: number
}

interface QuotesResponse {
  storage: string
  quotes: QuoteWithCounts[]
  votes?: Record<string, number>
}

// Must match signInMessage in api/_session.js byte for byte.
const signInMessage = (address: string) =>
  [
    'Ohnahji Quotes sign-in',
    '',
    'Sign this message to prove this wallet is yours and enable voting on the Quotes tab.',
    'This is not a transaction, it costs nothing, and it cannot move funds.',
    '',
    `Wallet: ${address}`,
  ].join('\n')

const SESSION_FLAG = 'ohnahji-quotes-session'
const PAGE_SIZE = 30

// Card colours rotate white, gold, burgundy, black. The slide background
// is brand pink, so pink stays out of the cycle: a pink card would vanish
// into the background even with its black border.
const CARD_STYLES = [
  'bg-ohnahji-white text-ohnahji-black',
  'bg-ohnahji-gold text-ohnahji-black',
  'bg-ohnahji-burgundy text-ohnahji-white',
  'bg-ohnahji-black text-ohnahji-white',
]

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const formatDate = (q: SeedQuote) => {
  const [y, m, d] = q.date.split('-').map(Number)
  return `${q.weekday.slice(0, 3)}, ${MONTH_NAMES[(m ?? 1) - 1]?.slice(0, 3)} ${d}, ${y}`
}

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

const SELECT_CLASS =
  'bg-ohnahji-white border-[4px] border-ohnahji-black rounded-xl font-black text-xs px-2.5 py-2 shadow-neo-sm cursor-pointer max-w-full'

const SlideQuotes = () => {
  const { copy, weight } = useSlideSettings('/quotes')
  const copyClass = weight ? ' slide-copy' : ''
  const { client, chain } = useStore()
  const account = useActiveAccount()
  const address = account?.address

  // Owner feature switch (ADMIN tab): off pauses voting site-wide.
  // Scores stay readable; the arrows are replaced by a paused note.
  const { data: siteConfig } = useSiteConfig()
  const votingEnabled = siteConfig?.features.quotesVoting !== false

  const [weekday, setWeekday] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [episode, setEpisode] = useState('')
  const [sort, setSort] = useState<'BEST' | 'WORST' | 'NEW'>('BEST')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sessionKnown, setSessionKnown] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SESSION_FLAG) === '1',
  )
  const [pendingVote, setPendingVote] = useState<string | null>(null)
  const [voteNote, setVoteNote] = useState('')
  const [overrides, setOverrides] = useState<Record<string, { up: number; down: number; score: number }>>({})
  const [myVoteOverrides, setMyVoteOverrides] = useState<Record<string, number>>({})

  // Public feed (counts). The seed ships with the site, so the board is
  // readable even before this lands; counts merge in when it does.
  const feedQuery = useQuery({
    queryKey: ['quotes-feed'],
    queryFn: async (): Promise<QuotesResponse> => {
      const res = await fetch('/api/quotes')
      if (!res.ok) throw new Error(`quotes API responded ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 20,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // This wallet's own votes, for arrow highlighting. Reading a vote map
  // needs no auth; the address is public.
  const myVotesQuery = useQuery({
    queryKey: ['quotes-my-votes', address],
    queryFn: async (): Promise<Record<string, number>> => {
      const res = await fetch(`/api/quotes?voter=${address}`)
      if (!res.ok) throw new Error(`quotes API responded ${res.status}`)
      const json = (await res.json()) as QuotesResponse
      return json.votes ?? {}
    },
    enabled: !!address,
    staleTime: 1000 * 20,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [weekday, month, year, episode, sort])

  useEffect(() => {
    setMyVoteOverrides({})
    setOverrides({})
    setVoteNote('')
  }, [address])

  const filterOptions = useMemo(() => {
    const weekdays = WEEKDAY_ORDER.filter((w) => SEED_QUOTES.some((q) => q.weekday === w))
    const months = [...new Set(SEED_QUOTES.map((q) => q.month))].sort((a, b) => a - b)
    const years = [...new Set(SEED_QUOTES.map((q) => q.year))].sort((a, b) => b - a)
    const episodes = [...new Set(SEED_QUOTES.map((q) => q.day))].sort((a, b) => b - a)
    return { weekdays, months, years, episodes }
  }, [])

  const countsById = useMemo(() => {
    const map = new Map<string, { up: number; down: number; score: number }>()
    for (const q of feedQuery.data?.quotes ?? []) map.set(q.id, { up: q.up, down: q.down, score: q.score })
    return map
  }, [feedQuery.data])

  const myVotes = useMemo(
    () => ({ ...(myVotesQuery.data ?? {}), ...myVoteOverrides }),
    [myVotesQuery.data, myVoteOverrides],
  )

  const visible = useMemo(() => {
    const merged: QuoteWithCounts[] = SEED_QUOTES.map((q) => {
      const c = overrides[q.id] ?? countsById.get(q.id) ?? { up: 0, down: 0, score: 0 }
      return { ...q, ...c }
    })
    const filtered = merged.filter(
      (q) =>
        (!weekday || q.weekday === weekday) &&
        (!month || q.month === Number(month)) &&
        (!year || q.year === Number(year)) &&
        (!episode || q.day === Number(episode)),
    )
    const byId = (a: QuoteWithCounts, b: QuoteWithCounts) => (a.id < b.id ? -1 : 1)
    if (sort === 'BEST') filtered.sort((a, b) => b.score - a.score || b.day - a.day || byId(a, b))
    else if (sort === 'WORST') filtered.sort((a, b) => a.score - b.score || b.day - a.day || byId(a, b))
    else filtered.sort((a, b) => b.day - a.day || byId(a, b))
    return filtered
  }, [countsById, overrides, weekday, month, year, episode, sort])

  const anyFilter = weekday || month || year || episode
  const resetFilters = () => {
    setWeekday('')
    setMonth('')
    setYear('')
    setEpisode('')
  }

  const signIn = async (): Promise<boolean> => {
    if (!account) return false
    try {
      const signature = await (account as any).signMessage({ message: signInMessage(account.address) })
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, signature }),
      })
      if (!res.ok) return false
      window.localStorage.setItem(SESSION_FLAG, '1')
      setSessionKnown(true)
      return true
    } catch {
      return false
    }
  }

  const castVote = async (quote: QuoteWithCounts, direction: 1 | -1) => {
    if (!votingEnabled || pendingVote) return
    if (!account) {
      setVoteNote('Connect a wallet to vote. Reading is free; voting takes any wallet, no OG required.')
      document.getElementById('quotes-connect')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const target = (myVotes[quote.id] ?? 0) === direction ? 0 : direction
    setPendingVote(quote.id)
    setVoteNote('')
    try {
      if (!sessionKnown) {
        const ok = await signIn()
        if (!ok) {
          setVoteNote('Sign-in was cancelled or failed. Your vote needs that one signature; it is free and moves no funds.')
          return
        }
      }
      let res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id, direction: target }),
      })
      if (res.status === 401) {
        // Session expired or was never issued here; sign once and retry.
        window.localStorage.removeItem(SESSION_FLAG)
        setSessionKnown(false)
        const ok = await signIn()
        if (!ok) {
          setVoteNote('Your session expired and re-signing was cancelled.')
          return
        }
        res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: quote.id, direction: target }),
        })
      }
      if (!res.ok) {
        setVoteNote('That vote did not land. Try again in a moment.')
        return
      }
      const json = await res.json()
      setOverrides((prev) => ({ ...prev, [quote.id]: { up: json.up, down: json.down, score: json.score } }))
      setMyVoteOverrides((prev) => ({ ...prev, [quote.id]: json.yourVote }))
    } finally {
      setPendingVote(null)
    }
  }

  const signOut = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signout' }),
    }).catch(() => undefined)
    window.localStorage.removeItem(SESSION_FLAG)
    setSessionKnown(false)
    setVoteNote('Signed out of voting. Your past votes stay counted.')
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-6"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold">ONE-LINERS</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-black mb-4${copyClass}`}>{copy.heading}</h1>
          <p className={`text-xl text-ohnahji-burgundy font-bold max-w-2xl mx-auto${copyClass}`}>
            {copy.paragraph}
          </p>
        </motion.div>

        <div id="quotes-connect" className="flex flex-col items-center gap-3 mb-6">
          {!address ? (
            <>
              <ConnectButton
                client={client}
                chain={chain}
                theme={OHNAHJI_WALLET_THEME}
                connectButton={{
                  label: 'CONNECT TO VOTE',
                  className:
                    '!bg-ohnahji-gold !text-ohnahji-black !border-[4px] !border-ohnahji-black !rounded-xl !font-black !text-xs !px-4 !py-2 !h-auto !shadow-neo-sm !border-solid',
                }}
              />
              <p className="text-xs font-bold text-ohnahji-burgundy/90">
                Connect a wallet to vote. No OG token needed, no transaction, no gas.
              </p>
            </>
          ) : sessionKnown ? (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="bg-ohnahji-black text-ohnahji-gold px-4 py-2 border-[4px] border-ohnahji-black rounded-full font-black text-xs">
                VOTING AS {shortAddress(address)}
              </span>
              <button
                onClick={signOut}
                className="font-black text-xs text-ohnahji-burgundy underline underline-offset-4"
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <p className="text-xs font-bold text-ohnahji-burgundy/90 text-center">
              Wallet connected as {shortAddress(address)}. Your first vote asks for one free signature
              to start your voting session.
            </p>
          )}
          {voteNote && (
            <p className="bg-ohnahji-white text-ohnahji-black font-bold text-sm px-4 py-2 border-[4px] border-ohnahji-black rounded-xl max-w-xl text-center">
              {voteNote}
            </p>
          )}
          {feedQuery.isError && (
            <p className="text-xs font-bold text-ohnahji-burgundy/90">
              Live vote counts are unavailable right now; the archive below is still fully readable.
            </p>
          )}
          {!votingEnabled && (
            <p className="bg-ohnahji-white text-ohnahji-black font-bold text-sm px-4 py-2 border-[4px] border-ohnahji-black rounded-xl max-w-xl text-center">
              Voting is paused right now. The scores below are frozen as they stand; reading is still free for everyone.
            </p>
          )}
        </div>

        {/* Filter bar */}
        <div className="sticky top-0 z-20 bg-ohnahji-pink/95 backdrop-blur-sm py-3 -mx-2 px-2">
          <div className="flex flex-wrap items-end gap-2.5 justify-center">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-ohnahji-burgundy/90">WEEKDAY</span>
              <select aria-label="Filter by day of week" className={SELECT_CLASS} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                <option value="">All days</option>
                {filterOptions.weekdays.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-ohnahji-burgundy/90">MONTH</span>
              <select aria-label="Filter by month" className={SELECT_CLASS} value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">All months</option>
                {filterOptions.months.map((m) => (
                  <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-ohnahji-burgundy/90">YEAR</span>
              <select aria-label="Filter by year" className={SELECT_CLASS} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">All years</option>
                {filterOptions.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-ohnahji-burgundy/90">EPISODE</span>
              <select aria-label="Filter by episode" className={SELECT_CLASS} value={episode} onChange={(e) => setEpisode(e.target.value)}>
                <option value="">All episodes</option>
                {filterOptions.episodes.map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-widest text-ohnahji-burgundy/90">SORT</span>
              <select aria-label="Sort quotes" className={SELECT_CLASS} value={sort} onChange={(e) => setSort(e.target.value as 'BEST' | 'WORST' | 'NEW')}>
                <option value="BEST">Best</option>
                <option value="WORST">Worst</option>
                <option value="NEW">Newest</option>
              </select>
            </label>
            {anyFilter && (
              <button
                onClick={resetFilters}
                className="bg-ohnahji-black text-ohnahji-white border-[4px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                RESET
              </button>
            )}
          </div>
          <p className="text-center text-xs font-black text-ohnahji-burgundy/80 mt-2" role="status">
            {visible.length} {visible.length === 1 ? 'QUOTE' : 'QUOTES'}
            {anyFilter ? ' MATCH THE FILTERS' : ' IN THE ARCHIVE'}
          </p>
        </div>

        {/* Feed */}
        {visible.length === 0 ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy mb-2">No quotes match those filters</p>
            <p className="font-bold text-ohnahji-burgundy/90">Loosen a filter or two and the board fills back up.</p>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 gap-4 mt-2">
              {visible.slice(0, visibleCount).map((quote, i) => {
                const mine = myVotes[quote.id] ?? 0
                const cardClass = CARD_STYLES[i % CARD_STYLES.length]
                const isDark = cardClass.includes('burgundy') || cardClass.includes('bg-ohnahji-black')
                return (
                  <article
                    key={quote.id}
                    className={`neo-card ${cardClass} rounded-3xl p-5 mb-4 break-inside-avoid flex gap-4`}
                  >
                    {!votingEnabled ? (
                      <div className="flex flex-col items-center gap-1.5 shrink-0 w-11" aria-label={`Score ${quote.score}`}>
                        <span className={`font-black text-2xl leading-none ${isDark ? 'text-ohnahji-white' : 'text-ohnahji-black'}`}>
                          {quote.score}
                        </span>
                        <span className={`text-[9px] font-black tracking-widest text-center leading-tight ${isDark ? 'text-ohnahji-white/70' : 'text-ohnahji-burgundy/70'}`}>
                          VOTING PAUSED
                        </span>
                      </div>
                    ) : (
                    <div className="flex flex-col items-center gap-1 shrink-0" aria-label={`Score ${quote.score}`}>
                      <button
                        onClick={() => castVote(quote, 1)}
                        disabled={pendingVote === quote.id}
                        title={address ? 'Vote up' : 'Connect a wallet to vote'}
                        aria-label={`Upvote: ${quote.text.slice(0, 40)}`}
                        aria-pressed={mine === 1}
                        className={`w-9 h-9 flex items-center justify-center border-[3px] border-ohnahji-black rounded-lg transition-all disabled:opacity-50 ${
                          mine === 1
                            ? 'bg-ohnahji-black text-ohnahji-gold shadow-none'
                            : 'bg-ohnahji-white text-ohnahji-black shadow-neo-sm hover:translate-y-[-1px]'
                        }`}
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={3.5} />
                      </button>
                      <span className={`font-black text-lg leading-none ${isDark ? 'text-ohnahji-white' : 'text-ohnahji-black'}`}>
                        {quote.score}
                      </span>
                      <button
                        onClick={() => castVote(quote, -1)}
                        disabled={pendingVote === quote.id}
                        title={address ? 'Vote down' : 'Connect a wallet to vote'}
                        aria-label={`Downvote: ${quote.text.slice(0, 40)}`}
                        aria-pressed={mine === -1}
                        className={`w-9 h-9 flex items-center justify-center border-[3px] border-ohnahji-black rounded-lg transition-all disabled:opacity-50 ${
                          mine === -1
                            ? 'bg-ohnahji-black text-ohnahji-pink shadow-none'
                            : 'bg-ohnahji-white text-ohnahji-black shadow-neo-sm hover:translate-y-[1px]'
                        }`}
                      >
                        <ChevronDown className="w-5 h-5" strokeWidth={3.5} />
                      </button>
                    </div>
                    )}
                    <div className="min-w-0">
                      <div className={`font-black text-5xl leading-[0.5] select-none ${isDark ? 'text-ohnahji-gold' : 'text-ohnahji-pink'}`} aria-hidden="true">
                        &ldquo;
                      </div>
                      <p className={`${isDark ? 'font-extrabold' : 'font-black'} text-lg md:text-xl leading-snug mt-2 break-words`}>{quote.text}</p>
                      <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className="bg-ohnahji-black text-ohnahji-gold px-2.5 py-1 rounded-full font-black text-[10px] tracking-widest">
                          DAY {quote.day}
                        </span>
                        <span className={`text-[11px] font-bold ${isDark ? 'text-ohnahji-white/70' : 'text-ohnahji-burgundy/60'}`}>
                          {formatDate(quote)}
                        </span>
                      </div>
                      {quote.context && (
                        <p className={`text-xs font-bold mt-2 ${isDark ? 'text-ohnahji-white/75' : 'text-ohnahji-burgundy/75'}`}>
                          {quote.context}
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
            {/* Mobile trailing room: on large-overflow feeds the
                scroller-level spacer is inert (it only floors maxScroll
                on short slides), so the button needs its own in-flow
                margin to clear the dock. 224px lifts the button from
                124px below the dock top to 100px above it at 390px.
                Desktop keeps the original 16px. */}
            {visibleCount < visible.length && (
              <div className="text-center mt-2 mb-56 md:mb-4">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="bg-ohnahji-pink text-ohnahji-white px-6 py-3 border-[6px] border-ohnahji-black rounded-full font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
                >
                  SHOW MORE ({visible.length - visibleCount} LEFT)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SlideQuotes
