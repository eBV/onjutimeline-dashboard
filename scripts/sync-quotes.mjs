#!/usr/bin/env node
// sync-quotes.mjs: regenerate the QUOTES tab seed from the one-liner
// pipeline archive.
//
// Source of truth: ~/workspace/ohnahji-brand/one-liners/
//   - dayNNN_candidates.md (+ _round2/_round3, + dayNNN-overtime_candidates.md)
//   - dayNNN-stylelab/build*.py pick records (slug/lines/subline dicts)
//
// Inclusion rules (standing attribution rules from the pipeline):
//   - A candidate is included only when its "Speaker confidence" is HIGH and
//     the confidence note carries no exclusion flag (relayed lines, lines he
//     is reading aloud or voicing for others, "do not attribute" notes).
//     MEDIUM and MEDIUM-HIGH are excluded; LOW is excluded.
//   - Stylelab picks are the published pick record, so they are included
//     as-is (any source credit rides in the subline, which becomes the
//     quote's context). A stylelab pick whose text matches an already
//     included candidate is not duplicated.
//   - Nothing is invented: text comes verbatim from the card-quote fields
//     and the stylelab line lists.
//
// Dates: the stream runs daily; Day 424 = 2026-10-15 is the anchor, so
// Day N falls on 2026-10-15 + (N - 424) days. The ISO date is baked into
// each record here; the browser never computes it.
//
// Output: src/lib/quotes-data.json and api/quotes-data.json, written
// byte-identical in the same pass (deterministic: stable per-day ids in
// source order, sorted days, one record per line so daily diffs stay
// clean). The site imports the first via src/lib/quotes.ts; the
// serverless API imports the second.
// Rerun after each new day's candidates land:
//
//   node scripts/sync-quotes.mjs
//
// Set ONE_LINERS_DIR to override the archive location.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ONE_LINERS_DIR =
  process.env.ONE_LINERS_DIR ?? path.join(homedir(), 'workspace', 'ohnahji-brand', 'one-liners')
// Two byte-identical outputs from the same generation pass: the site
// bundle imports src/lib/quotes-data.json (via src/lib/quotes.ts) and
// the serverless API imports api/quotes-data.json, so neither side
// depends on bundler or function file tracing reaching across the tree.
const OUT_PATHS = [
  path.join(REPO_ROOT, 'src', 'lib', 'quotes-data.json'),
  path.join(REPO_ROOT, 'api', 'quotes-data.json'),
]

const ANCHOR_DAY = 424
const ANCHOR_UTC = Date.UTC(2026, 9, 15) // 2026-10-15
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const dateForDay = (day) => {
  const d = new Date(ANCHOR_UTC + (day - ANCHOR_DAY) * 86400000)
  const iso = d.toISOString().slice(0, 10)
  return { date: iso, weekday: WEEKDAYS[d.getUTCDay()], month: d.getUTCMonth() + 1, year: d.getUTCFullYear() }
}

// --- text helpers -----------------------------------------------------------

const cleanQuoteText = (raw) => {
  let t = raw.replace(/\s*\n\s*/g, ' ').trim()
  if (t.startsWith('"') && t.endsWith('"') && t.length > 1) t = t.slice(1, -1).trim()
  return t
}

const contextFromSubline = (subline) => {
  if (!subline) return undefined
  const c = subline.replace(/;\s*Day \d+\s*$/i, '').trim()
  return c || undefined
}

const normalizeForMatch = (text) =>
  text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

const sameQuote = (a, b) => {
  const na = normalizeForMatch(a)
  const nb = normalizeForMatch(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const wa = new Set(na.split(' '))
  const wb = new Set(nb.split(' '))
  let inter = 0
  for (const w of wa) if (wb.has(w)) inter++
  const jaccard = inter / (wa.size + wb.size - inter)
  if (jaccard >= 0.72) return true
  // Stylelab lines are hand-wrapped subsets of the card text; a strong
  // containment in either direction also counts as the same quote.
  const shorter = na.length < nb.length ? na : nb
  const longer = na.length < nb.length ? nb : na
  return shorter.length >= 40 && longer.includes(shorter)
}

// --- candidate files --------------------------------------------------------

const EXCLUSION_FLAGS = [
  'do not attribute',
  'not attribute to',
  'do not attribute the words',
  'relayed',
  'relaying',
  'secondhand',
  'voicing others',
  'reading chat',
  'read-aloud',
  'read aloud',
  "words are miss v",
  'relayed speaker quote',
]

const parseCandidatesFile = (filePath) => {
  const md = readFileSync(filePath, 'utf8')
  const sections = md.split(/^## /m).slice(1)
  const out = []
  for (const section of sections) {
    const headline = section.split('\n', 1)[0]
    if (!/^\d+\./.test(headline)) continue

    const quoteMatch = section.match(/\*\*Card quote[^*]*:\*\*[ \t]*\n?([\s\S]*?)(?=\n\s*\n\*\*|\n---|\n\*\*|$)/)
    if (!quoteMatch) continue
    const text = cleanQuoteText(quoteMatch[1])
    if (!text) continue

    const confMatch = section.match(/\*\*Speaker confidence:\*\*\s*([^\n]+)/)
    const confidence = confMatch ? confMatch[1].trim() : ''
    const subMatch = section.match(/\*\*Suggested subline:\*\*\s*([^\n]+)/)
    out.push({ text, confidence, subline: subMatch ? subMatch[1].trim() : undefined })
  }
  return out
}

const candidateIncluded = (confidence) => {
  if (!confidence) return { ok: false, why: 'no confidence note' }
  if (!/^HIGH\b/.test(confidence)) return { ok: false, why: 'not HIGH' }
  const lower = confidence.toLowerCase()
  for (const flag of EXCLUSION_FLAGS) {
    if (lower.includes(flag)) return { ok: false, why: `flag: ${flag}` }
  }
  if (/^high\s*;\s*(guest|zaal|boss|zai)\b/i.test(confidence)) return { ok: false, why: 'guest speaker' }
  return { ok: true }
}

// --- stylelab pick records ----------------------------------------------------

const parseStylelabDir = (dir) => {
  const picks = []
  const pyFiles = readdirSync(dir).filter((f) => f.endsWith('.py')).sort()
  for (const file of pyFiles) {
    const src = readFileSync(path.join(dir, file), 'utf8')
    const dictRe = /dict\(\s*slug="([^"]+)",\s*lines=\[([\s\S]*?)\](?:,\s*subline="([^"]*)")?/g
    let m
    while ((m = dictRe.exec(src)) !== null) {
      const [, slug, linesBlock, subline] = m
      const lines = [...linesBlock.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) =>
        x[1].replace(/\\"/g, '"').replace(/\\'/g, "'"),
      )
      if (!lines.length) continue
      picks.push({ slug, text: lines.join(' '), subline })
    }
  }
  return picks
}

// --- main ---------------------------------------------------------------------

const main = () => {
  if (!existsSync(ONE_LINERS_DIR)) {
    console.error(`one-liners archive not found at ${ONE_LINERS_DIR}`)
    process.exit(1)
  }
  const entries = readdirSync(ONE_LINERS_DIR)

  // Group candidate files by day.
  const byDay = new Map() // day -> {base, rounds: Map<n, file>, overtime}
  for (const name of entries) {
    let m = name.match(/^day(\d+)_candidates(?:_round(\d+))?\.md$/)
    if (m) {
      const day = Number(m[1])
      const rec = byDay.get(day) ?? {}
      if (m[2]) (rec.rounds ??= new Map()).set(Number(m[2]), name)
      else rec.base = name
      byDay.set(day, rec)
      continue
    }
    m = name.match(/^day(\d+)-overtime_candidates\.md$/)
    if (m) {
      const day = Number(m[1])
      const rec = byDay.get(day) ?? {}
      rec.overtime = name
      byDay.set(day, rec)
    }
  }

  const stylelabByDay = new Map()
  for (const name of entries) {
    const m = name.match(/^day(\d+)-stylelab$/)
    if (m) stylelabByDay.set(Number(m[1]), path.join(ONE_LINERS_DIR, name))
  }

  const days = [...new Set([...byDay.keys(), ...stylelabByDay.keys()])].sort((a, b) => a - b)
  const quotes = []
  const summary = []

  for (const day of days) {
    const included = [] // {text, context}
    const seenTexts = []
    const stats = { candidates: 0, candIn: 0, candOut: 0, picks: 0, pickIn: 0, pickDup: 0 }

    const rec = byDay.get(day)
    const filesInOrder = []
    if (rec?.base) filesInOrder.push(rec.base)
    if (rec?.rounds) for (const n of [...rec.rounds.keys()].sort((a, b) => a - b)) filesInOrder.push(rec.rounds.get(n))
    if (rec?.overtime) filesInOrder.push(rec.overtime)

    for (const file of filesInOrder) {
      for (const cand of parseCandidatesFile(path.join(ONE_LINERS_DIR, file))) {
        stats.candidates++
        const verdict = candidateIncluded(cand.confidence)
        if (!verdict.ok) {
          stats.candOut++
          continue
        }
        if (seenTexts.some((t) => sameQuote(t, cand.text))) {
          stats.candOut++
          continue
        }
        seenTexts.push(cand.text)
        stats.candIn++
        included.push({ text: cand.text, context: contextFromSubline(cand.subline) })
      }
    }

    const stylelabDir = stylelabByDay.get(day)
    if (stylelabDir) {
      for (const pick of parseStylelabDir(stylelabDir)) {
        stats.picks++
        if (seenTexts.some((t) => sameQuote(t, pick.text))) {
          stats.pickDup++
          continue
        }
        seenTexts.push(pick.text)
        stats.pickIn++
        included.push({ text: pick.text, context: contextFromSubline(pick.subline) })
      }
    }

    included.forEach((q, i) => {
      quotes.push({
        id: `d${day}-${String(i + 1).padStart(2, '0')}`,
        text: q.text,
        day,
        ...dateForDay(day),
        ...(q.context ? { context: q.context } : {}),
      })
    })
    summary.push({ day, ...stats, total: included.length })
  }

  const body = quotes.map((q) => `  ${JSON.stringify(q)}`).join(',\n')
  const out = `[\n${body}\n]\n`
  for (const outPath of OUT_PATHS) writeFileSync(outPath, out)

  let total = 0
  for (const s of summary) {
    total += s.total
    console.log(
      `Day ${s.day}: ${s.total} quotes (candidates ${s.candIn}/${s.candidates} in, stylelab picks +${s.pickIn}, ${s.pickDup} duplicates)`,
    )
  }
  console.log(
    `TOTAL: ${total} quotes across ${summary.length} days -> ${OUT_PATHS.map((p) => path.relative(REPO_ROOT, p)).join(' + ')}`,
  )
}

main()
