import { evaluateAnswer, applyAnswer, getMaxLives } from '../services/gameLogicService.js'
import type { GameState, GameAction } from '../types/index.js'

export const initialState: GameState = {
  phase: 'setup',
  mode: 'normal',
  selectedCategory: null,
  lives: 0,
  maxLives: 0,
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
      const maxLives = getMaxLives(action.mode)
      return {
        ...state,
        phase: 'playing',
        mode: action.mode,
        selectedCategory: action.category,
        lives: maxLives,
        maxLives,
        streak: 0,
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
          // the instant before the fatal guess). The wrong-answer reset to 0
          // is only meaningful for an ongoing run, not the final score.
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

    case 'PLAY_AGAIN': {
      return {
        ...state,
        phase: 'playing',
        lives: state.maxLives,
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

    case 'SET_BEST_STREAK': {
      return {
        ...state,
        bestStreak: Math.max(state.bestStreak, action.bestStreak),
      }
    }

    default:
      return state
  }
}
