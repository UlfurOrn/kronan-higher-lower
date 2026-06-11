import { describe, it, expect } from 'vitest'
import { evaluateAnswer, applyAnswer, getMaxLives } from '../gameLogicService.js'
import type { GameProduct } from '../../types/index.js'

function makeProduct(pricePerUnit: number): GameProduct {
  return {
    sku: `sku-${pricePerUnit}`,
    name: 'Test vara',
    categorySlug: 'test',
    categoryName: 'Test',
    imageUrl: 'https://example.com/img.jpg',
    priceIsk: pricePerUnit,
    pricePerUnit,
    unitLabel: 'kr/kg',
  }
}

describe('getMaxLives', () => {
  it('returns 3 for normal mode', () => {
    expect(getMaxLives('normal')).toBe(3)
  })

  it('returns 1 for hard mode', () => {
    expect(getMaxLives('hard')).toBe(1)
  })
})

describe('evaluateAnswer', () => {
  const low = makeProduct(100)
  const high = makeProduct(200)
  const equal = makeProduct(100)

  describe('guess: higher', () => {
    it('correct when right is higher', () => {
      expect(evaluateAnswer(low, high, 'higher')).toBe(true)
    })

    it('incorrect when right is lower', () => {
      expect(evaluateAnswer(high, low, 'higher')).toBe(false)
    })

    it('correct when prices are equal (equal treated as correct)', () => {
      expect(evaluateAnswer(low, equal, 'higher')).toBe(true)
    })
  })

  describe('guess: lower', () => {
    it('correct when right is lower', () => {
      expect(evaluateAnswer(high, low, 'lower')).toBe(true)
    })

    it('incorrect when right is higher', () => {
      expect(evaluateAnswer(low, high, 'lower')).toBe(false)
    })

    it('correct when prices are equal (equal treated as correct)', () => {
      expect(evaluateAnswer(low, equal, 'lower')).toBe(true)
    })
  })
})

describe('applyAnswer', () => {
  const baseState = { lives: 3, streak: 2, bestStreak: 5 }

  describe('correct answer', () => {
    it('increments streak', () => {
      const result = applyAnswer(baseState, true)
      expect(result.newStreak).toBe(3)
    })

    it('does not change lives', () => {
      const result = applyAnswer(baseState, true)
      expect(result.livesRemaining).toBe(3)
    })

    it('updates bestStreak when new streak exceeds it', () => {
      const result = applyAnswer({ lives: 1, streak: 5, bestStreak: 5 }, true)
      expect(result.newBestStreak).toBe(6)
    })

    it('does not reduce bestStreak', () => {
      const result = applyAnswer({ lives: 1, streak: 1, bestStreak: 10 }, true)
      expect(result.newBestStreak).toBe(10)
    })

    it('sets gameOver to false', () => {
      const result = applyAnswer(baseState, true)
      expect(result.gameOver).toBe(false)
    })
  })

  describe('incorrect answer', () => {
    it('resets streak to 0', () => {
      const result = applyAnswer(baseState, false)
      expect(result.newStreak).toBe(0)
    })

    it('deducts one life', () => {
      const result = applyAnswer(baseState, false)
      expect(result.livesRemaining).toBe(2)
    })

    it('does not change bestStreak on wrong answer', () => {
      const result = applyAnswer(baseState, false)
      expect(result.newBestStreak).toBe(5)
    })

    it('sets gameOver to false when lives remain', () => {
      const result = applyAnswer({ lives: 2, streak: 1, bestStreak: 1 }, false)
      expect(result.gameOver).toBe(false)
      expect(result.livesRemaining).toBe(1)
    })

    it('sets gameOver to true when last life lost', () => {
      const result = applyAnswer({ lives: 1, streak: 3, bestStreak: 3 }, false)
      expect(result.gameOver).toBe(true)
      expect(result.livesRemaining).toBe(0)
    })

    it('lives never go below 0', () => {
      const result = applyAnswer({ lives: 0, streak: 0, bestStreak: 0 }, false)
      expect(result.livesRemaining).toBe(0)
    })
  })
})
