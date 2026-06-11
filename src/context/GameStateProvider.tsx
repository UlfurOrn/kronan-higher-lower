import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type Dispatch,
} from 'react'
import { gameReducer, initialState } from '../reducers/gameReducer.js'
import { writeBestScore } from '../services/localStorageService.js'
import type { GameState, GameAction } from '../types/index.js'

interface GameStateContextValue {
  state: GameState
  dispatch: Dispatch<GameAction>
}

const GameStateContext = createContext<GameStateContextValue | null>(null)

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Persist the best score for the current mode/time limit whenever it changes.
  // writeBestScore only stores it if it beats the existing record, so re-writing
  // a freshly-loaded best (e.g. on START_GAME) is a harmless no-op.
  useEffect(() => {
    if (state.bestStreak > 0) {
      writeBestScore(state.mode, state.timeLimit, state.bestStreak)
    }
  }, [state.bestStreak, state.mode, state.timeLimit])

  const value = React.useMemo(() => ({ state, dispatch }), [state, dispatch])

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  )
}

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext)
  if (!ctx) {
    throw new Error('useGameState must be used within a GameStateProvider')
  }
  return ctx
}
