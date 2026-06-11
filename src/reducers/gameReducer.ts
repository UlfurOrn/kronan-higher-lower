import { evaluateAnswer, applyAnswer, STARTING_LIVES } from '../services/gameLogicService.js'
import type { GameState, GameAction } from '../types/index.js'

export const initialState: GameState = {
  phase: 'setup',
  mode: 'classic',
  timeLimit: null,
  selectedCategories: [],
  lives: 0,
  streak: 0,
  bestStreak: 0,
  currentLeft: null,
  currentRight: null,
  lastRound: null,
  activePool: [],
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...state,
        phase: 'playing',
        mode: action.mode,
        timeLimit: action.timeLimit,
        selectedCategories: action.categories,
        lives: STARTING_LIVES,
        streak: 0,
        bestStreak: action.bestStreak,
        currentLeft: action.initialLeft,
        currentRight: action.initialRight,
        activePool: action.activePool,
        lastRound: null,
      }
    }

    case 'ANSWER': {
      if (!state.currentLeft || !state.currentRight) return state

      const correct = evaluateAnswer(state.currentLeft, state.currentRight, action.guess)
      const result = applyAnswer(
        { lives: state.lives, streak: state.streak, bestStreak: state.bestStreak },
        correct
      )

      if (result.gameOver) {
        return {
          ...state,
          phase: 'game_over',
          lives: 0,
          // Preserve the run the player reached this game (what the HUD showed
          // the instant before the fatal guess) as the final score.
          streak: state.streak,
          bestStreak: result.newBestStreak,
          lastRound: {
            left: state.currentLeft,
            right: state.currentRight,
            guess: action.guess,
          },
        }
      }

      return {
        ...state,
        lives: result.livesRemaining,
        streak: result.newStreak,
        bestStreak: result.newBestStreak,
      }
    }

    case 'NEXT_ROUND': {
      return {
        ...state,
        currentLeft: state.currentRight,
        currentRight: action.nextProduct,
      }
    }

    case 'TIME_UP': {
      // Timed mode only: the clock ran out without failing. The current streak
      // is the final score; there is no losing round to show.
      if (state.phase !== 'playing') return state
      return {
        ...state,
        phase: 'game_over',
        lives: 0,
        lastRound: null,
      }
    }

    case 'PLAY_AGAIN': {
      // Replays the same mode/time limit, so bestStreak (already loaded for it) carries over.
      return {
        ...state,
        phase: 'playing',
        lives: STARTING_LIVES,
        streak: 0,
        currentLeft: action.initialLeft,
        currentRight: action.initialRight,
        activePool: action.activePool,
        lastRound: null,
      }
    }

    case 'CHANGE_SETTINGS': {
      return {
        ...state,
        phase: 'setup',
        lives: 0,
        streak: 0,
        currentLeft: null,
        currentRight: null,
        lastRound: null,
        activePool: [],
      }
    }

    default:
      return state
  }
}
