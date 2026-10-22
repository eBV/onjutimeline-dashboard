import { createThirdwebClient, defineChain } from 'thirdweb'
import { ethereum } from 'thirdweb/chains'

// Thirdweb client ID is a publishable key (safe to embed in frontend bundles).
// Override via env for other deployments; falls back to the project's key.
const CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID || '09797204fc3d09a0636257d079ebcb80'

let _client: ReturnType<typeof createThirdwebClient> | null = null
let _chain: ReturnType<typeof defineChain> | null = null

/**
 * Lazily-initialised thirdweb client. This module is only imported from
 * code-split chunks (WalletConnect, Slide2Mint), so the ~1MB thirdweb
 * dependency never lands in the initial entry bundle.
 */
export function getThirdwebClient() {
  if (!_client) _client = createThirdwebClient({ clientId: CLIENT_ID })
  return _client
}

export function getChain() {
  if (!_chain) _chain = defineChain(ethereum)
  return _chain
}
