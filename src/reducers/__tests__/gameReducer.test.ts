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
    mode: 'classic',
    timeLimit: null,
    categories: [],
    bestStreak: 0,
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

    it('starts with a single life in classic mode', () => {
      const state = startedState()
      expect(state.lives).toBe(1)
      expect(state.mode).toBe('classic')
      expect(state.timeLimit).toBeNull()
    })

    it('starts with a single life and the chosen time limit in timed mode', () => {
      const state = gameReducer(initialState, {
        type: 'START_GAME',
        mode: 'timed',
        timeLimit: 60,
        categories: [],
        bestStreak: 0,
        initialLeft: pA,
        initialRight: pB,
        activePool: pool,
      })
      expect(state.lives).toBe(1)
      expect(state.mode).toBe('timed')
      expect(state.timeLimit).toBe(60)
    })

    it('resets streak to 0', () => {
      const state = startedState()
      expect(state.streak).toBe(0)
    })

    it('stores the selected category slugs', () => {
      const state = gameReducer(initialState, {
        type: 'START_GAME',
        mode: 'classic',
        timeLimit: null,
        categories: ['mjolk', 'kjot'],
        bestStreak: 0,
        initialLeft: pA,
        initialRight: pB,
        activePool: pool,
      })
      expect(state.selectedCategories).toEqual(['mjolk', 'kjot'])
    })

    it('loads the best score supplied for the chosen mode/time limit', () => {
      const state = gameReducer(initialState, {
        type: 'START_GAME',
        mode: 'timed',
        timeLimit: 30,
        categories: [],
        bestStreak: 7,
        initialLeft: pA,
        initialRight: pB,
        activePool: pool,
      })
      expect(state.bestStreak).toBe(7)
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

    it('keeps the player alive and playing', () => {
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'higher' })
      expect(state.lives).toBe(1)
      expect(state.phase).toBe('playing')
    })

    it('updates bestStreak when streak exceeds it', () => {
      const s = startedState({ streak: 9, bestStreak: 9 })
      const newState = gameReducer(s, { type: 'ANSWER', guess: 'higher' })
      expect(newState.bestStreak).toBe(10)
    })
  })

  describe('ANSWER — incorrect (single life ends the run)', () => {
    it('ends the game and zeroes lives', () => {
      // pA=100, pB=200, guess lower → incorrect
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'lower' })
      expect(state.phase).toBe('game_over')
      expect(state.lives).toBe(0)
    })

    it('preserves the run streak as the final score on game over', () => {
      const state = gameReducer(startedState({ streak: 6 }), { type: 'ANSWER', guess: 'lower' })
      expect(state.phase).toBe('game_over')
      expect(state.streak).toBe(6)
    })

    it('records lastRound on game over', () => {
      const state = gameReducer(startedState(), { type: 'ANSWER', guess: 'lower' })
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

  describe('TIME_UP (timed mode)', () => {
    it('ends the game keeping the streak as the final score, with no losing round', () => {
      const s = startedState({ mode: 'timed', timeLimit: 60, streak: 8 })
      const state = gameReducer(s, { type: 'TIME_UP' })
      expect(state.phase).toBe('game_over')
      expect(state.streak).toBe(8)
      expect(state.lastRound).toBeNull()
    })

    it('is ignored when not in the playing phase', () => {
      const state = gameReducer(initialState, { type: 'TIME_UP' })
      expect(state.phase).toBe('setup')
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
    it('resets to playing with a single life', () => {
      const over = gameReducer(startedState(), { type: 'ANSWER', guess: 'lower' })
      const again = gameReducer(over, {
        type: 'PLAY_AGAIN',
        initialLeft: pA,
        initialRight: pC,
        activePool: pool,
      })
      expect(again.phase).toBe('playing')
      expect(again.lives).toBe(1)
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
})
