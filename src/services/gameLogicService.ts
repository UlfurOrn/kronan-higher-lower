import type { GameMode, GameProduct, AnswerResult } from '../types/index.js'

/**
 * Pure game logic functions — no side effects, fully unit-testable.
 */

export function getMaxLives(mode: GameMode): number {
  return mode === 'normal' ? 3 : 1
}

export function evaluateAnswer(
  left: GameProduct,
  right: GameProduct,
  guess: 'higher' | 'lower'
): boolean {
  if (guess === 'higher') {
    return right.pricePerUnit >= left.pricePerUnit
  }
  return right.pricePerUnit <= left.pricePerUnit
}

export function applyAnswer(
  state: { lives: number; streak: number; bestStreak: number },
  correct: boolean
): AnswerResult {
  if (correct) {
    const newStreak = state.streak + 1
    const newBestStreak = Math.max(state.bestStreak, newStreak)
    return {
      correct: true,
      livesRemaining: state.lives,
      newStreak,
      newBestStreak,
      gameOver: false,
    }
  }

  const newLives = Math.max(0, state.lives - 1)
  return {
    correct: false,
    livesRemaining: newLives,
    newStreak: 0,
    newBestStreak: state.bestStreak,
    gameOver: newLives === 0,
  }
}
