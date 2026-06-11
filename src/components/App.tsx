import { GameStateProvider, useGameState } from '../context/GameStateProvider.js'
import { SetupScreen } from './SetupScreen.js'
import { GameScreen } from './GameScreen.js'
import { GameOverScreen } from './GameOverScreen.js'
import productsData from '../data/products.json'
import type { GameProduct } from '../types/index.js'
import styles from './App.module.css'

// Make products available globally for components that need them
// This avoids prop-drilling through context for the static dataset
const products = productsData as GameProduct[]
;(window as unknown as { __products: GameProduct[] }).__products = products

function GameRouter() {
  const { state } = useGameState()

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />
    case 'playing':
      return <GameScreen />
    case 'game_over':
      return <GameOverScreen />
    default:
      return <SetupScreen />
  }
}

export function App() {
  return (
    <GameStateProvider>
      <div className={styles.app}>
        <GameRouter />
      </div>
    </GameStateProvider>
  )
}
