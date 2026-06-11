import type { GameMode } from '../types/index.js'

const KEY = 'kronan_best_scores'

/**
 * Persists best scores per mode. Classic has a single best; timed has a
 * separate best per time limit (e.g. "timed:30", "timed:60", "timed:120"),
 * so a 30s run and a 120s run never compete for the same record.
 *
 * Stored as a JSON map under one key, e.g.
 *   { "classic": 14, "timed:30": 5, "timed:60": 9, "timed:120": 12 }
 *
 * Gracefully handles unavailable storage (private browsing, quota exceeded).
 */

type BestScores = Record<string, number>

function scoreKey(mode: GameMode, timeLimit: number | null): string {
  return mode === 'timed' ? `timed:${timeLimit}` : 'classic'
}

function readAll(): BestScores {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as BestScores) : {}
  } catch {
    return {}
  }
}

export function readBestScore(mode: GameMode, timeLimit: number | null): number {
  const value = readAll()[scoreKey(mode, timeLimit)]
  return typeof value === 'number' && value > 0 ? value : 0
}

/** Writes the value only if it beats the stored best for that mode/time limit. */
export function writeBestScore(mode: GameMode, timeLimit: number | null, value: number): void {
  try {
    const all = readAll()
    const key = scoreKey(mode, timeLimit)
    if (value > (all[key] ?? 0)) {
      all[key] = value
      localStorage.setItem(KEY, JSON.stringify(all))
    }
  } catch {
    // Silently ignore (private browsing, storage quota exceeded)
  }
}
