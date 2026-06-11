import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type Dispatch,
} from 'react'
import { gameReducer, initialState } from '../reducers/gameReducer.js'
import { readBestStreak, writeBestStreak } from '../services/localStorageService.js'
import type { GameState, GameAction } from '../types/index.js'

interface GameStateContextValue {
  state: GameState
  dispatch: Dispatch<GameAction>
}

const GameStateContext = createContext<GameStateContextValue | null>(null)

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // On mount: load best streak from localStorage
  useEffect(() => {
    const saved = readBestStreak()
    if (saved > 0) {
      dispatch({ type: 'SET_BEST_STREAK', bestStreak: saved })
    }
  }, [])

  // Persist best streak when it increases
  const prevBestStreak = React.useRef(state.bestStreak)
  useEffect(() => {
    if (state.bestStreak > prevBestStreak.current) {
      writeBestStreak(state.bestStreak)
      prevBestStreak.current = state.bestStreak
    }
  }, [state.bestStreak])

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
