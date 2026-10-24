// Pure vote math for the Quotes tab, shared by the API handlers and the
// unit tests. A vote direction is 1 (up), -1 (down) or 0 (no vote).
// Reddit semantics: voting the opposite way switches, voting the same
// way again retracts (handled by the client sending 0), and the counts
// only ever move by the deltas computed here.

export const isDirection = (d) => d === 1 || d === -1 || d === 0

export function voteDeltas(prev, next) {
  return {
    upDelta: (next === 1 ? 1 : 0) - (prev === 1 ? 1 : 0),
    downDelta: (next === -1 ? 1 : 0) - (prev === -1 ? 1 : 0),
  }
}

export const applyDeltas = (counts, deltas) => ({
  up: Math.max(0, (counts?.up ?? 0) + deltas.upDelta),
  down: Math.max(0, (counts?.down ?? 0) + deltas.downDelta),
})

export const scoreOf = (counts) => (counts?.up ?? 0) - (counts?.down ?? 0)
