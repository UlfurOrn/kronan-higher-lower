import { describe, it, expect, beforeEach } from 'vitest'
import { readBestScore, writeBestScore } from '../localStorageService.js'

describe('localStorageService — per-mode / per-time-limit best scores', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns 0 when nothing is stored', () => {
    expect(readBestScore('classic', null)).toBe(0)
    expect(readBestScore('timed', 60)).toBe(0)
  })

  it('persists and reads back the classic best', () => {
    writeBestScore('classic', null, 14)
    expect(readBestScore('classic', null)).toBe(14)
  })

  it('tracks a separate best for each timed time limit', () => {
    writeBestScore('timed', 30, 5)
    writeBestScore('timed', 60, 9)
    writeBestScore('timed', 120, 12)

    expect(readBestScore('timed', 30)).toBe(5)
    expect(readBestScore('timed', 60)).toBe(9)
    expect(readBestScore('timed', 120)).toBe(12)
  })

  it('keeps classic and timed bests independent', () => {
    writeBestScore('classic', null, 20)
    writeBestScore('timed', 60, 8)
    expect(readBestScore('classic', null)).toBe(20)
    expect(readBestScore('timed', 60)).toBe(8)
  })

  it('only overwrites when the new score is higher', () => {
    writeBestScore('timed', 60, 9)
    writeBestScore('timed', 60, 4) // lower — ignored
    expect(readBestScore('timed', 60)).toBe(9)
    writeBestScore('timed', 60, 11) // higher — stored
    expect(readBestScore('timed', 60)).toBe(11)
  })
})
