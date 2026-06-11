import { useGameState } from '../context/GameStateProvider.js'
import { ProductCard } from './ProductCard.js'
import { buildPool, pickInitialPair } from '../services/productPoolService.js'
import styles from './GameOverScreen.module.css'

export function GameOverScreen() {
  const { state, dispatch } = useGameState()
  const { streak, bestStreak, lastRound, selectedCategories, mode, timeLimit } = state

  const ranOutOfTime = lastRound === null
  const heading = ranOutOfTime ? 'Tíminn búinn!' : 'Leikur lokið!'
  const bestLabel =
    mode === 'timed' ? `Besta (${timeLimit}s)` : 'Besta (klassískt)'

  function handlePlayAgain() {
    const allProducts = (window as unknown as { __products: typeof state.activePool }).__products ?? []
    const pool = buildPool(allProducts, selectedCategories)
    const { left, right } = pickInitialPair(pool)
    dispatch({ type: 'PLAY_AGAIN', initialLeft: left, initialRight: right, activePool: pool })
  }

  function handleChangeSettings() {
    dispatch({ type: 'CHANGE_SETTINGS' })
  }

  return (
    <div className={styles.screen} data-testid="game-over-screen">
      <h1 className={styles.heading}>{heading}</h1>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Þín stig</span>
          <span className={styles.statValue}>{streak}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{bestLabel}</span>
          <span className={styles.statValue}>{bestStreak}</span>
        </div>
      </div>

      {lastRound && (
        <div className={styles.losingRound}>
          <p className={styles.losingLabel}>Hér fór þú úr leiknum:</p>
          <div className={styles.cards}>
            <ProductCard
              product={lastRound.left}
              revealed={true}
              variant="neutral"
              position="left"
            />
            <ProductCard
              product={lastRound.right}
              revealed={true}
              variant="incorrect"
              position="right"
            />
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          onClick={handlePlayAgain}
          data-testid="play-again-btn"
        >
          Spila aftur
        </button>
        <button
          className={styles.secondaryBtn}
          onClick={handleChangeSettings}
          data-testid="change-settings-btn"
        >
          Breyta stillingum
        </button>
      </div>
    </div>
  )
}
