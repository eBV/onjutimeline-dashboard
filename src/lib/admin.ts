// Admin allowlist, client copy.
//
// This list only controls whether the ADMIN tab renders for the
// connected wallet. It is NOT the security boundary: the config API
// re-checks the session wallet against the server copy in
// api/_admin.js on every read and write, so a forged client gains
// nothing. Keep the two lists in sync when adding an admin.
//
// Owner wallet, ENS-verified both directions on 2026-10-23:
// ohnahji.eth = 0x64A15b1D2DE581097CB48e5D82619203E24BB3e1

export const ADMIN_ADDRESSES = ['0x64a15b1d2de581097cb48e5d82619203e24bb3e1']

export const ADMIN_PATH = '/admin'

export const isAdminAddress = (address?: string | null): boolean =>
  !!address && ADMIN_ADDRESSES.includes(address.toLowerCase())
