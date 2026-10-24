import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The two emitted seed files (site bundle + API copy) must be identical,
// and rerunning the generator must reproduce them byte for byte, so the
// daily sync produces clean diffs. This test reruns the generator for
// real; it writes the same bytes it read if the archive is unchanged.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const siteSeed = path.join(repoRoot, 'src', 'lib', 'quotes-data.json')
const apiSeed = path.join(repoRoot, 'api', 'quotes-data.json')

describe('quotes seed generator', () => {
  test('site and API seeds are byte-identical, and regeneration is deterministic', () => {
    const beforeSite = readFileSync(siteSeed, 'utf8')
    const beforeApi = readFileSync(apiSeed, 'utf8')
    expect(beforeSite).toBe(beforeApi)
    execFileSync('node', ['scripts/sync-quotes.mjs'], { cwd: repoRoot, stdio: 'pipe' })
    expect(readFileSync(siteSeed, 'utf8')).toBe(beforeSite)
    expect(readFileSync(apiSeed, 'utf8')).toBe(beforeApi)
  }, 60000)
})
