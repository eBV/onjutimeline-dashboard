import { useSlideSettings } from '../../lib/siteConfig'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ConnectButton, useActiveAccount } from 'thirdweb/react'
import { OHNAHJI_WALLET_THEME } from '../../lib/walletTheme'
import { StorageClient, walletOnly } from '@lens-chain/storage-client'
import { useStore } from '../../hooks/useStore'
import { useHolderStatus } from '../../hooks/useHolderStatus'

// Grove Vault v1: a holder-gated file locker on Grove (Lens storage).
// The gate is the app-level balanceOf read on the OG contract (shared via
// useHolderStatus; it also decides whether this slide exists in the deck
// at all). Uploads go to Grove with a walletOnly ACL bound to Ethereum
// mainnet (chain id 1), so only the uploading wallet can edit or delete
// them. Grove content is publicly readable by link; see the caveat copy
// in the vault UI.

const STORAGE_KEY = 'grove-vault-uploads-v1'
const MAX_FILE_BYTES = 125 * 1024 * 1024 // Grove upload limit: 125 MB

interface VaultUpload {
  uri: string
  gatewayUrl: string
  name: string
  size: number
  uploadedAt: number
  address: string
}

const loadUploads = (): VaultUpload[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SlideVault = () => {
  const { copy, weight } = useSlideSettings('/vault')
  const copyClass = weight ? ' slide-copy' : ''
  const navigate = useNavigate()
  const account = useActiveAccount()
  const { client, chain } = useStore()
  const address = account?.address

  const [uploads, setUploads] = useState<VaultUpload[]>(loadUploads)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copiedUri, setCopiedUri] = useState<string | null>(null)
  const [deletingUri, setDeletingUri] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storageClient = useMemo(() => StorageClient.create(), [])

  // The storage client deletes with a generic Signer; the thirdweb account
  // exposes signMessage, so adapt it. If a wallet does not expose it, the
  // delete button is hidden and the note below explains why.
  const signer = useMemo(() => {
    if (!account || typeof (account as any).signMessage !== 'function') return null
    return {
      signMessage: ({ message }: { message: string }) =>
        (account as any).signMessage({ message }),
    }
  }, [account])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
    } catch {
      // Storage full or unavailable; the session list still works in memory.
    }
  }, [uploads])

  const holder = useHolderStatus()
  const balance = holder.balance
  const isHolder = holder.isHolder

  const myUploads = address ? uploads.filter((u) => u.address.toLowerCase() === address.toLowerCase()) : []

  const handleUpload = async () => {
    if (!file || !address) return
    if (file.size > MAX_FILE_BYTES) {
      setUploadError('That file is over the 125 MB Grove limit. Pick a smaller one.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const response = await storageClient.uploadFile(file, {
        acl: walletOnly(address as `0x${string}`, 1),
      })
      const entry: VaultUpload = {
        uri: response.uri,
        gatewayUrl: response.gatewayUrl,
        name: file.name,
        size: file.size,
        uploadedAt: Date.now(),
        address,
      }
      setUploads((prev) => [entry, ...prev])
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError('Upload failed. Grove did not take the file; try again in a moment.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (item: VaultUpload) => {
    if (!signer) return
    setDeletingUri(item.uri)
    setUploadError(null)
    try {
      await storageClient.delete(item.uri, signer)
      setUploads((prev) => prev.filter((u) => u.uri !== item.uri))
    } catch {
      setUploadError(`Could not delete ${item.name}. Grove may still be propagating it; try again shortly.`)
    } finally {
      setDeletingUri(null)
    }
  }

  const copyText = async (text: string, marker: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUri(marker)
      setTimeout(() => setCopiedUri((cur) => (cur === marker ? null : cur)), 2000)
    } catch {
      // Clipboard unavailable; the OPEN button still reaches the file.
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold">HOLDERS ONLY</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-white mb-4${copyClass}`}>
            {copy.heading}
          </h1>
          <p className={`text-xl text-ohnahji-gold font-bold max-w-xl mx-auto${copyClass}`}>
            {copy.paragraph}
          </p>
        </motion.div>

        {!account ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy mb-2">Connect to check your pass</p>
            <p className="font-bold text-ohnahji-burgundy/70 mb-6">
              The Vault opens for wallets holding at least one OG Ohnahji PFP. Connect your wallet and we will check the chain.
            </p>
            <ConnectButton
              client={client}
              chain={chain}
              theme={OHNAHJI_WALLET_THEME}
              connectButton={{
                className: "!w-full !py-4 !bg-ohnahji-gold !text-ohnahji-black !border-[6px] !border-ohnahji-black !rounded-2xl !font-black !shadow-neo hover:!shadow-neo-lg active:!shadow-neo-active !transition-all !text-xl !h-auto !border-solid",
                label: "CONNECT WALLET"
              }}
            />
          </div>
        ) : holder.isChecking ? (
          <div className="text-center py-16" role="status" aria-label="Checking holder status">
            <p className="text-ohnahji-white text-2xl font-black animate-pulse">CHECKING YOUR PASS...</p>
          </div>
        ) : holder.isError ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy mb-2">Could not check the chain</p>
            <p className="font-bold text-ohnahji-burgundy/70 mb-6">The holder check did not go through. Give it another try.</p>
            <button
              onClick={() => holder.refetch()}
              className="bg-ohnahji-pink text-ohnahji-white px-6 py-3 border-[6px] border-ohnahji-black rounded-full font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all"
            >
              RETRY
            </button>
          </div>
        ) : !isHolder ? (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-8 text-center">
            <p className="font-black text-2xl text-ohnahji-burgundy mb-2">Hold an OG PFP to enter</p>
            <p className="font-bold text-ohnahji-burgundy/70 mb-6">
              This wallet does not hold an OG Ohnahji PFP yet. Mint one and the Vault opens.
            </p>
            <button
              onClick={() => navigate('/mint')}
              className="bg-ohnahji-pink text-ohnahji-white px-8 py-4 border-[6px] border-ohnahji-black rounded-full font-black text-lg shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
            >
              MINT AN OG
            </button>
          </div>
        ) : (
          <div className="neo-card bg-ohnahji-white rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h2 className="font-black text-2xl text-ohnahji-burgundy">You are in</h2>
              <span className="bg-ohnahji-gold text-ohnahji-black text-xs font-black px-3 py-1 rounded-full border-2 border-ohnahji-black">
                {balance} OG PFP{(balance ?? 0) === 1 ? '' : 'S'} HELD
              </span>
            </div>

            <p className="font-bold text-sm text-ohnahji-burgundy/80 bg-ohnahji-gold/30 border-[4px] border-ohnahji-black rounded-2xl px-4 py-3 mb-6">
              Vault files are public to anyone with the link; only your wallet can edit or delete them.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <label className="flex-1 cursor-pointer bg-ohnahji-white border-[4px] border-dashed border-ohnahji-burgundy/50 rounded-2xl px-4 py-3 font-bold text-sm text-ohnahji-burgundy truncate">
                {file ? `${file.name} (${formatSize(file.size)})` : 'Choose a file (max 125 MB)'}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null)
                    setUploadError(null)
                  }}
                />
              </label>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-ohnahji-pink text-ohnahji-white px-6 py-3 border-[6px] border-ohnahji-black rounded-2xl font-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-neo"
              >
                {uploading ? 'UPLOADING...' : 'UPLOAD TO GROVE'}
              </button>
            </div>
            {uploadError && (
              <p className="font-bold text-sm text-red-700 mt-2" role="alert">{uploadError}</p>
            )}

            <h3 className="font-black text-lg text-ohnahji-burgundy mt-8 mb-3">Your uploads this device</h3>
            {myUploads.length === 0 ? (
              <p className="font-bold text-sm text-ohnahji-burgundy/60">Nothing here yet. Your uploads will be listed on this device.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {myUploads.map((item) => (
                  <li key={item.uri} className="border-[4px] border-ohnahji-black rounded-2xl p-3 flex flex-col gap-2 bg-ohnahji-white">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-sm text-ohnahji-black truncate max-w-full">{item.name}</span>
                      <span className="text-[11px] font-bold text-ohnahji-burgundy/50">
                        {formatSize(item.size)} · {new Date(item.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-ohnahji-burgundy/70 break-all">{item.gatewayUrl}</span>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => copyText(item.gatewayUrl, item.uri)}
                        className="bg-ohnahji-gold text-ohnahji-black text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-ohnahji-black"
                      >
                        {copiedUri === item.uri ? 'COPIED' : 'COPY LINK'}
                      </button>
                      <a
                        href={item.gatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-ohnahji-black text-ohnahji-gold text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-ohnahji-black"
                      >
                        OPEN ↗
                      </a>
                      {signer ? (
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingUri === item.uri}
                          className="bg-ohnahji-pink text-ohnahji-white text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-ohnahji-black disabled:opacity-50"
                        >
                          {deletingUri === item.uri ? 'DELETING...' : 'DELETE'}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-ohnahji-burgundy/50 self-center">
                          Delete is unavailable: this wallet cannot sign messages here.
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SlideVault
