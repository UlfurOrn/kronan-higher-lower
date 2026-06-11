const KEY = 'kronan_best_streak'

/**
 * Wraps localStorage access for best streak persistence.
 * Gracefully handles unavailable storage (private browsing, quota exceeded).
 */

export function readBestStreak(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return 0
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? 0 : Math.max(0, parsed)
  } catch {
    return 0
  }
}

export function writeBestStreak(value: number): void {
  try {
    localStorage.setItem(KEY, String(value))
  } catch {
    // Silently ignore (private browsing, storage quota exceeded)
  }
}
