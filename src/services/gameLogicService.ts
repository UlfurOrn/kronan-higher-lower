import type { GameProduct, AnswerResult } from '../types/index.js'

/**
 * Pure game logic functions — no side effects, fully unit-testable.
 */

/** Both modes are single-life: one wrong answer ends the run ("without failing"). */
export const STARTING_LIVES = 1

/** Selectable time limits (seconds) offered in timed mode. */
export const TIME_LIMIT_OPTIONS = [30, 60, 120] as const

/** Default time limit pre-selected in timed mode. */
export const DEFAULT_TIME_LIMIT = 60

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
