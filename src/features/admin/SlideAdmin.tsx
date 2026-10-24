import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useActiveAccount } from 'thirdweb/react'
import { CONFIGURABLE_SLIDES } from '../../lib/siteConfig'
import {
  DEFAULT_SITE_CONFIG,
  mergeSiteConfig,
  WEIGHT_STEPS,
  COPY_MAX_CHARS,
  type SiteConfig,
  type SiteFeatures,
  type SlideGate,
} from '../../lib/siteConfig'

// The ADMIN slide: the owner's live site controls.
//
// This slide only exists in the deck while the connected wallet is the
// owner (src/lib/admin.ts), and every read/write here goes through
// /api/admin/config, which re-checks the session wallet server-side
// (api/_admin.js). The panel edits the STORED config: toggles and
// colour changes save automatically (PUT the full document), the
// shell's site-config query is invalidated so the owner's own deck
// reshapes immediately, and everyone else picks changes up within the
// endpoint's ~60s edge cache.

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

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

const FEATURE_INFO: { key: keyof SiteFeatures; name: string; blurb: string }[] = [
  { key: 'mintPill', name: 'Mint button', blurb: 'The pink MINT pill next to the wallet button, on every slide.' },
  { key: 'quotesVoting', name: 'Quotes voting', blurb: 'Up and down votes on the Quotes board. Off freezes the scores as they stand.' },
  { key: 'twitchVodRows', name: 'Twitch VOD rows', blurb: 'The LATEST BROADCASTS and TOP CLIPS rows on Live. The player itself always stays.' },
  { key: 'antiPhishingLine', name: 'Safety line', blurb: 'The "Ohnahji will never DM you first" line under the Socials links.' },
]

type LoadState = 'loading' | 'needs-signin' | 'forbidden' | 'ready' | 'error'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const WEIGHT_NAME: Record<number, string> = {
  300: 'Light 300',
  400: 'Regular 400',
  500: 'Medium 500',
  600: 'Semibold 600',
  700: 'Bold 700',
  800: 'Extra-bold 800',
}

const SELECT_CLASS =
  'bg-ohnahji-white border-[3px] border-ohnahji-black rounded-xl font-black text-xs px-2 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'

const MoveButton = ({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: 'up' | 'down'
  disabled?: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="w-11 h-11 shrink-0 rounded-xl border-[3px] border-ohnahji-black bg-ohnahji-white font-black text-lg text-ohnahji-black shadow-neo-sm active:shadow-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
  >
    {direction === 'up' ? '↑' : '↓'}
  </button>
)

const Toggle = ({
  on,
  disabled,
  label,
  onChange,
}: {
  on: boolean
  disabled?: boolean
  label: string
  onChange: (next: boolean) => void
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative w-16 h-9 shrink-0 rounded-full border-[3px] border-ohnahji-black transition-all ${
      on ? 'bg-ohnahji-gold' : 'bg-ohnahji-white'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'shadow-neo-sm active:shadow-none cursor-pointer'}`}
  >
    <span
      className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ohnahji-black transition-all ${
        on ? 'left-[34px]' : 'left-[3px]'
      }`}
    />
  </button>
)

const SlideAdmin = () => {
  const account = useActiveAccount()
  const queryClient = useQueryClient()

  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [draft, setDraft] = useState<SiteConfig | null>(null)
  const [storageMode, setStorageMode] = useState<string>('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [hexDrafts, setHexDrafts] = useState<Record<string, string>>({})

  const lastSaved = useRef<SiteConfig | null>(null)
  const hexTimer = useRef<number | null>(null)
  const copyTimer = useRef<number | null>(null)

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const res = await fetch('/api/admin/config')
      if (res.status === 401) return setLoadState('needs-signin')
      if (res.status === 403) return setLoadState('forbidden')
      if (!res.ok) throw new Error(`admin config responded ${res.status}`)
      const json = await res.json()
      setStorageMode(json.storage ?? '')
      const effective = mergeSiteConfig(json.config)
      lastSaved.current = effective
      setDraft(effective)
      setHexDrafts({})
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (next: SiteConfig) => {
      setSaveState('saving')
      setSaveError('')
      try {
        const res = await fetch('/api/admin/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          const detail = Array.isArray(json?.details) ? json.details.join('; ') : json?.error
          throw new Error(detail || `save failed (${res.status})`)
        }
        const json = await res.json()
        setStorageMode(json.storage ?? '')
        lastSaved.current = next
        setSaveState('saved')
        // The owner's own deck reshapes right away, no 60s cache wait.
        queryClient.invalidateQueries({ queryKey: ['site-config'] })
      } catch (e) {
        // Revert the controls to the last state the server accepted.
        if (lastSaved.current) setDraft(lastSaved.current)
        setHexDrafts({})
        setSaveState('error')
        setSaveError(e instanceof Error ? e.message : 'That change did not save.')
      }
    },
    [queryClient],
  )

  const applyNow = (next: SiteConfig) => {
    setDraft(next)
    void save(next)
  }

  const applyHex = (path: string, hex: string) => {
    if (!draft) return
    const next: SiteConfig = {
      ...draft,
      slides: { ...draft.slides, [path]: { ...draft.slides[path], hex } },
    }
    setDraft(next)
    // Colour pickers fire continuously while dragging; debounce the PUT.
    if (hexTimer.current) window.clearTimeout(hexTimer.current)
    hexTimer.current = window.setTimeout(() => void save(next), 600)
  }

  const applyCopy = (path: string, field: 'heading' | 'paragraph', value: string) => {
    if (!draft) return
    const entry = draft.slides[path]
    if (!entry) return
    const next: SiteConfig = {
      ...draft,
      slides: { ...draft.slides, [path]: { ...entry, copy: { ...entry.copy, [field]: value } } },
    }
    setDraft(next)
    // Typing fires continuously; debounce the PUT like colours.
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => void save(next), 600)
  }

  const moveSlide = (path: string, dir: -1 | 1) => {
    if (!draft) return
    const order = [...draft.order]
    const i = order.indexOf(path)
    const j = i + dir
    // The hero at index 0 never moves, and nothing may move into its
    // slot, so the first movable row is index 1 moving down only.
    if (i <= 0 || j <= 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    applyNow({ ...draft, order })
  }

  const signIn = async () => {
    if (!account) return
    setSigningIn(true)
    setSaveError('')
    try {
      const signature = await (account as any).signMessage({ message: signInMessage(account.address) })
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, signature }),
      })
      if (!res.ok) throw new Error('sign-in failed')
      await load()
    } catch {
      setSaveError('Sign-in was cancelled or failed. The panel needs that one free signature; it moves no funds.')
    } finally {
      setSigningIn(false)
    }
  }

  const resetAll = () => {
    const fresh: SiteConfig = JSON.parse(JSON.stringify(DEFAULT_SITE_CONFIG))
    setDraft(fresh)
    setHexDrafts({})
    setConfirmReset(false)
    void save(fresh)
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-10 md:py-10">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold">OWNER ONLY</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-white mb-4">Site controls</h1>
          <p className="text-lg text-ohnahji-white/85 font-bold max-w-xl mx-auto">
            Only your wallet, ohnahji.eth, can see this tab. Changes save automatically
            and apply to every visitor.
          </p>
        </motion.div>

        {loadState === 'loading' && (
          <p className="text-center text-ohnahji-white font-black text-lg">LOADING YOUR CONTROLS...</p>
        )}

        {loadState === 'needs-signin' && (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-6 md:p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-black mb-2">One signature to open the panel</p>
            <p className="font-bold text-ohnahji-burgundy mb-5 max-w-md mx-auto">
              The controls live behind your wallet session, the same free sign-in as Quotes
              voting. It is not a transaction and moves no funds.
            </p>
            <button
              onClick={signIn}
              disabled={signingIn || !account}
              className="bg-ohnahji-gold text-ohnahji-black px-6 py-3 border-[4px] border-ohnahji-black rounded-xl font-black text-sm shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {signingIn ? 'WAITING FOR SIGNATURE...' : 'SIGN IN TO MANAGE THE SITE'}
            </button>
            {saveError && <p className="mt-4 font-bold text-sm text-red-700">{saveError}</p>}
          </div>
        )}

        {loadState === 'forbidden' && (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-6 md:p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-black mb-2">This session is not the owner wallet</p>
            <p className="font-bold text-ohnahji-burgundy">
              The signed-in session belongs to a different wallet. Sign out of voting on the
              Quotes tab, reconnect as ohnahji.eth, and sign in again.
            </p>
          </div>
        )}

        {loadState === 'error' && (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-6 md:p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-black mb-2">The controls did not load</p>
            <p className="font-bold text-ohnahji-burgundy mb-5">The site itself is unaffected; it keeps running on its defaults.</p>
            <button
              onClick={load}
              className="bg-ohnahji-gold text-ohnahji-black px-6 py-3 border-[4px] border-ohnahji-black rounded-xl font-black text-sm shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {loadState === 'ready' && draft && (
          <div className="flex flex-col gap-6">
            {/* Save status */}
            <div className="flex items-center justify-center gap-3" role="status" aria-live="polite">
              {saveState === 'saving' && <span className="font-black text-ohnahji-gold tracking-widest text-sm">SAVING...</span>}
              {saveState === 'saved' && <span className="font-black text-ohnahji-white tracking-widest text-sm">✓ SAVED</span>}
              {saveState === 'error' && (
                <span className="bg-ohnahji-white text-red-700 font-bold text-sm px-4 py-2 border-[4px] border-ohnahji-black rounded-xl">
                  Not saved: {saveError} The control was put back.
                </span>
              )}
            </div>

            {/* TABS: rows render in the stored order, so the panel
                itself shows the deck order. Home stays first, on, and
                public; ADMIN is not listed and always stays last. */}
            <section className="neo-card bg-ohnahji-white rounded-3xl p-5 md:p-7" aria-label="Tabs">
              <h2 className="font-black text-3xl text-ohnahji-black mb-1">Tabs</h2>
              <p className="font-bold text-ohnahji-burgundy/80 text-sm mb-5">
                Order, visibility, gate, colour, type weight, and heading + paragraph copy
                for every tab. A gated tab vanishes for visitors who do not meet its gate,
                and its deep link lands on home for them.
              </p>
              <div className="flex flex-col divide-y-4 divide-ohnahji-black/10">
                {draft.order.map((path, orderIndex) => {
                  const meta = CONFIGURABLE_SLIDES.find((s) => s.path === path)
                  const entry = draft.slides[path]
                  if (!meta || !entry) return null
                  const isHome = path === '/'
                  const hexText = hexDrafts[path] ?? entry.hex
                  const hexValid = HEX_RE.test(hexText)
                  const canMoveUp = orderIndex > 1
                  const canMoveDown = orderIndex < draft.order.length - 1
                  return (
                    <div key={path} className="py-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                        <div className="min-w-[7.5rem] flex-1">
                          <p className="font-black text-lg text-ohnahji-black leading-tight">
                            {meta.name}
                            {entry.gate === 'og' && (
                              <span className="ml-2 align-middle bg-ohnahji-black text-ohnahji-gold px-2 py-0.5 rounded-full font-black text-[9px] tracking-widest">
                                HOLDERS
                              </span>
                            )}
                            {entry.gate === 'wallet' && (
                              <span className="ml-2 align-middle bg-ohnahji-burgundy text-ohnahji-white px-2 py-0.5 rounded-full font-black text-[9px] tracking-widest">
                                WALLET
                              </span>
                            )}
                          </p>
                          <p className="font-bold text-xs text-ohnahji-burgundy/70">{path}</p>
                          {isHome && (
                            <p className="font-bold text-[11px] text-ohnahji-burgundy/70">
                              Home is always first, on, and public.
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MoveButton
                            direction="up"
                            disabled={!canMoveUp}
                            label={`Move ${meta.name} earlier`}
                            onClick={() => moveSlide(path, -1)}
                          />
                          <MoveButton
                            direction="down"
                            disabled={!canMoveDown}
                            label={`Move ${meta.name} later`}
                            onClick={() => moveSlide(path, 1)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            aria-label={`Background colour for ${meta.name}`}
                            value={HEX_RE.test(entry.hex) ? entry.hex : '#000000'}
                            onChange={(e) => {
                              setHexDrafts((prev) => ({ ...prev, [path]: e.target.value }))
                              applyHex(path, e.target.value)
                            }}
                            className="w-11 h-11 shrink-0 rounded-xl border-[3px] border-ohnahji-black bg-ohnahji-white p-0.5 cursor-pointer"
                          />
                          <input
                            type="text"
                            aria-label={`Background hex for ${meta.name}`}
                            value={hexText}
                            spellCheck={false}
                            onChange={(e) => {
                              const value = e.target.value.trim()
                              setHexDrafts((prev) => ({ ...prev, [path]: value }))
                              if (HEX_RE.test(value)) applyHex(path, value)
                            }}
                            onBlur={() => {
                              if (!hexValid) {
                                setHexDrafts((prev) => ({ ...prev, [path]: entry.hex }))
                              }
                            }}
                            className={`w-24 font-black text-sm px-2 py-2 rounded-xl border-[3px] bg-ohnahji-white text-ohnahji-black ${
                              hexValid ? 'border-ohnahji-black' : 'border-red-600'
                            }`}
                          />
                        </div>
                        <Toggle
                          on={entry.visible}
                          disabled={isHome}
                          label={`Show the ${meta.name} tab`}
                          onChange={(visible) => {
                            if (!draft) return
                            applyNow({
                              ...draft,
                              slides: { ...draft.slides, [path]: { ...entry, visible } },
                            })
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2">
                          <span className="font-black text-xs text-ohnahji-black">Who can see it</span>
                          <select
                            aria-label={`Who can see the ${meta.name} tab`}
                            value={entry.gate}
                            disabled={isHome}
                            onChange={(e) => {
                              if (!draft) return
                              applyNow({
                                ...draft,
                                slides: {
                                  ...draft.slides,
                                  [path]: { ...entry, gate: e.target.value as SlideGate },
                                },
                              })
                            }}
                            className={SELECT_CLASS}
                          >
                            <option value="public">Everyone</option>
                            <option value="wallet">Connected wallet</option>
                            <option value="og">OG holders</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="font-black text-xs text-ohnahji-black">Type weight</span>
                          <select
                            aria-label={`Type weight for ${meta.name}`}
                            value={entry.weight ?? ''}
                            onChange={(e) => {
                              if (!draft) return
                              applyNow({
                                ...draft,
                                slides: {
                                  ...draft.slides,
                                  [path]: {
                                    ...entry,
                                    weight: e.target.value === '' ? null : Number(e.target.value),
                                  },
                                },
                              })
                            }}
                            className={SELECT_CLASS}
                          >
                            <option value="">Inherit sitewide</option>
                            {WEIGHT_STEPS.map((w) => (
                              <option key={w} value={w}>
                                {WEIGHT_NAME[w]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="font-black text-xs text-ohnahji-black">
                            Heading · {entry.copy.heading.length}/{COPY_MAX_CHARS}
                          </span>
                          <textarea
                            aria-label={`Heading for ${meta.name}`}
                            value={entry.copy.heading}
                            maxLength={COPY_MAX_CHARS}
                            rows={2}
                            onChange={(e) => applyCopy(path, 'heading', e.target.value)}
                            className="w-full font-bold text-sm px-3 py-2 rounded-xl border-[3px] border-ohnahji-black bg-ohnahji-white text-ohnahji-black resize-y"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-black text-xs text-ohnahji-black">
                            Paragraph · {entry.copy.paragraph.length}/{COPY_MAX_CHARS}
                          </span>
                          <textarea
                            aria-label={`Paragraph for ${meta.name}`}
                            value={entry.copy.paragraph}
                            maxLength={COPY_MAX_CHARS}
                            rows={2}
                            onChange={(e) => applyCopy(path, 'paragraph', e.target.value)}
                            className="w-full font-bold text-sm px-3 py-2 rounded-xl border-[3px] border-ohnahji-black bg-ohnahji-white text-ohnahji-black resize-y"
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* TYPE */}
            <section className="neo-card bg-ohnahji-white rounded-3xl p-5 md:p-7" aria-label="Type">
              <h2 className="font-black text-3xl text-ohnahji-black mb-1">Type</h2>
              <p className="font-bold text-ohnahji-burgundy/80 text-sm mb-5">
                One sitewide weight for slide headings and intro paragraphs. A tab's own
                weight above overrides it. Dock, pills, and chrome labels keep their
                designed weights either way, and weights never change sizes or spacing.
              </p>
              <label className="flex flex-wrap items-center gap-3">
                <span className="font-black text-lg text-ohnahji-black">Sitewide weight</span>
                <select
                  aria-label="Sitewide type weight"
                  value={draft.fontWeight ?? ''}
                  onChange={(e) => {
                    if (!draft) return
                    applyNow({
                      ...draft,
                      fontWeight: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }}
                  className={SELECT_CLASS}
                >
                  <option value="">As designed</option>
                  {WEIGHT_STEPS.map((w) => (
                    <option key={w} value={w}>
                      {WEIGHT_NAME[w]}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* FEATURES */}
            <section className="neo-card bg-ohnahji-white rounded-3xl p-5 md:p-7" aria-label="Features">
              <h2 className="font-black text-3xl text-ohnahji-black mb-1">Features</h2>
              <p className="font-bold text-ohnahji-burgundy/80 text-sm mb-5">
                Site-wide switches. Off means hidden or paused for every visitor, instantly reversible.
              </p>
              <div className="flex flex-col divide-y-4 divide-ohnahji-black/10">
                {FEATURE_INFO.map(({ key, name, blurb }) => (
                  <div key={key} className="py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg text-ohnahji-black leading-tight">{name}</p>
                      <p className="font-bold text-xs text-ohnahji-burgundy/75 leading-snug">{blurb}</p>
                    </div>
                    <Toggle
                      on={draft.features[key]}
                      label={name}
                      onChange={(value) => {
                        if (!draft) return
                        applyNow({ ...draft, features: { ...draft.features, [key]: value } })
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* FOOTER */}
            <section className="neo-card bg-ohnahji-white rounded-3xl p-5 md:p-7" aria-label="Storage and reset">
              {storageMode === 'kv' ? (
                <p className="font-bold text-ohnahji-black">
                  <span className="font-black">Storage: KV.</span> Your settings are saved in the
                  site's database, so they persist across deploys, devices, and visitors.
                </p>
              ) : (
                <p className="font-bold text-ohnahji-black">
                  <span className="font-black">Storage: memory only.</span> Settings work, but they
                  reset when the backend recycles. To make them permanent: open the Vercel
                  dashboard, this project, Storage tab, and connect a KV store. One click, no
                  code change; the next save after that persists for good.
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => (confirmReset ? resetAll() : setConfirmReset(true))}
                  onBlur={() => setConfirmReset(false)}
                  className={`px-5 py-3 border-[4px] border-ohnahji-black rounded-xl font-black text-sm shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${
                    confirmReset ? 'bg-red-600 text-white' : 'bg-ohnahji-pink text-ohnahji-white'
                  }`}
                >
                  {confirmReset ? 'TAP AGAIN TO CONFIRM RESET' : 'RESET TO DEFAULTS'}
                </button>
                <p className="font-bold text-xs text-ohnahji-burgundy/75 max-w-xs">
                  Reset turns every tab back on, restores the brand colours, order, gates,
                  weights, and copy, and switches every feature on. This ADMIN tab itself can
                  never be turned off.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default SlideAdmin
