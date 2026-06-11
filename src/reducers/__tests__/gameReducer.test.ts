import { describe, it, expect } from 'vitest'
import { gameReducer, initialState } from '../gameReducer.js'
import type { GameProduct, GameState } from '../../types/index.js'

function makeProduct(sku: string, pricePerUnit: number): GameProduct {
  return {
    sku,
    name: `Vara ${sku}`,
    categorySlug: 'mjolk',
    categoryName: 'Mjólk',
    imageUrl: 'https://example.com/img.jpg',
    priceIsk: pricePerUnit,
    pricePerUnit,
    unitLabel: 'kr/kg',
  }
}

const pA = makeProduct('A', 100)
const pB = makeProduct('B', 200)
const pC = makeProduct('C', 150)
const pool = [pA, pB, pC]

function startedState(overrides: Partial<GameState> = {}): GameState {
  const base = gameReducer(initialState, {
    type: 'START_GAME',
    mode: 'normal',
    category: null,
    initialLeft: pA,
    initialRight: pB,
    activePool: pool,
  })
  return { ...base, ...overrides }
}

describe('gameReducer', () => {
  describe('initial state', () => {
    it('has setup phase', () => {
      expect(initialState.phase).toBe('setup')
    })
  })

  describe('START_GAME', () => {
    it('transitions to playing phase', () => {
      const state = startedState()
      expect(state.phase).toBe('playing')
    })

    it('sets normal mode lives to 3', () => {
      const state = startedState()
      expect(state.lives).toBe(3)
      expect(state.maxLives).toBe(3)
    })

    it('sets hard mode lives to 1', () => {
      const state = gameReducer(initialState, {
        type: 'START_GAME',
        mode: 'hard',
        category: null,
        initialLeft: pA,
        initialRight: pB,
        activePool: pool,
      })
      expect(state.lives).toBe(1)
      expect(state.maxLives).toBe(1)
    })

    it('resets streak to 0', () => {
      const state = startedState()
      expect(state.streak).toBe(0)
    })

    it('preserves bestStreak from previous session', () => {
      const stateWithBest = { ...initialState, bestStreak: 7 }
      const newState = gameReducer(stateWithBest, {
        type: 'START_GAME',
        mode: 'normal',
        category: null,
        initialLeft: pA,
        initialRight: pB,
        activePool: pool,
      })
      expect(newState.bestStreak).toBe(7)
    })

    it('sets currentLeft and currentRight', () => {
      const state = startedState()
      expect(state.currentLeft?.sku).toBe('A')
      expect(state.currentRight?.sku).toBe('B')
    })
  })

  describe('ANSWER — correct', () => {
    it('increments streak', () => {
      // pA=100, pB=200, guess higher → correct
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'higher' })
      expect(state.streak).toBe(1)
    })

    it('does not lose a life', () => {
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'higher' })
      expect(state.lives).toBe(3)
    })

    it('stays in playing phase', () => {
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'higher' })
      expect(state.phase).toBe('playing')
    })

    it('updates bestStreak when streak exceeds it', () => {
      const s = startedState({ streak: 9, bestStreak: 9 })
      const newState = gameReducer(s, { type: 'ANSWER', guess: 'higher' })
      expect(newState.bestStreak).toBe(10)
    })
  })

  describe('ANSWER — incorrect', () => {
    it('resets streak to 0', () => {
      // pA=100, pB=200, guess lower → incorrect
      const state = gameReducer(startedState({ streak: 5 }), { type: 'ANSWER', guess: 'lower' })
      expect(state.streak).toBe(0)
    })

    it('deducts one life', () => {
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'lower' })
      expect(state.lives).toBe(2)
    })

    it('transitions to game_over when last life lost', () => {
      const lastLife = startedState({ lives: 1 })
      const state = gameReducer(lastLife, { type: 'ANSWER', guess: 'lower' })
      expect(state.phase).toBe('game_over')
    })

    it('preserves the run streak as the final score on game over', () => {
      const lastLife = startedState({ lives: 1, streak: 6 })
      const state = gameReducer(lastLife, { type: 'ANSWER', guess: 'lower' })
      expect(state.phase).toBe('game_over')
      expect(state.streak).toBe(6)
    })

    it('records lastRound on game over', () => {
      const lastLife = startedState({ lives: 1 })
      const state = gameReducer(lastLife, { type: 'ANSWER', guess: 'lower' })
      expect(state.lastRound?.left.sku).toBe('A')
      expect(state.lastRound?.right.sku).toBe('B')
      expect(state.lastRound?.guess).toBe('lower')
    })

    it('does not change bestStreak on wrong answer', () => {
      const s = startedState({ bestStreak: 10, streak: 3 })
      const state = gameReducer(s, { type: 'ANSWER', guess: 'lower' })
      expect(state.bestStreak).toBe(10)
    })
  })

  describe('NEXT_ROUND', () => {
    it('slides right to left, sets new right', () => {
      const state = gameReducer(startedState(), { type: 'NEXT_ROUND', nextProduct: pC })
      expect(state.currentLeft?.sku).toBe('B')
      expect(state.currentRight?.sku).toBe('C')
    })
  })

  describe('PLAY_AGAIN', () => {
    it('resets to playing with same maxLives', () => {
      const over = gameReducer(startedState({ lives: 1 }), { type: 'ANSWER', guess: 'lower' })
      const again = gameReducer(over, {
        type: 'PLAY_AGAIN',
        initialLeft: pA,
        initialRight: pC,
        activePool: pool,
      })
      expect(again.phase).toBe('playing')
      expect(again.lives).toBe(3)
    })

    it('resets streak to 0', () => {
      const again = gameReducer(startedState({ streak: 7 }), {
        type: 'PLAY_AGAIN',
        initialLeft: pA,
        initialRight: pC,
        activePool: pool,
      })
      expect(again.streak).toBe(0)
    })

    it('preserves bestStreak', () => {
      const again = gameReducer(startedState({ bestStreak: 12 }), {
        type: 'PLAY_AGAIN',
        initialLeft: pA,
        initialRight: pC,
        activePool: pool,
      })
      expect(again.bestStreak).toBe(12)
    })
  })

  describe('CHANGE_SETTINGS', () => {
    it('returns to setup phase', () => {
      const state = gameReducer(startedState(), { type: 'CHANGE_SETTINGS' })
      expect(state.phase).toBe('setup')
    })

    it('clears currentLeft, currentRight, activePool', () => {
      const state = gameReducer(startedState(), { type: 'CHANGE_SETTINGS' })
      expect(state.currentLeft).toBeNull()
      expect(state.currentRight).toBeNull()
      expect(state.activePool).toHaveLength(0)
    })
  })

  describe('SET_BEST_STREAK', () => {
    it('sets bestStreak from localStorage', () => {
      const state = gameReducer(initialState, { type: 'SET_BEST_STREAK', bestStreak: 8 })
      expect(state.bestStreak).toBe(8)
    })

    it('does not overwrite higher existing bestStreak', () => {
      const state = gameReducer({ ...initialState, bestStreak: 15 }, {
        type: 'SET_BEST_STREAK',
        bestStreak: 5,
      })
      expect(state.bestStreak).toBe(15)
    })
  })
})
