import { useState, useEffect, useCallback } from 'react'
import { HUD } from './HUD.js'
import { ProductCard } from './ProductCard.js'
import { AnswerButtons } from './AnswerButtons.js'
import { useGameState } from '../context/GameStateProvider.js'
import { evaluateAnswer } from '../services/gameLogicService.js'
import { pickNextProduct } from '../services/productPoolService.js'
import styles from './GameScreen.module.css'

const REVEAL_DELAY_MS = 900

export function GameScreen() {
  const { state, dispatch } = useGameState()
  const { currentLeft, currentRight, lives, streak, mode, timeLimit, selectedCategories, activePool } =
    state

  const [answered, setAnswered] = useState(false)
  const [revealVariant, setRevealVariant] = useState<'neutral' | 'correct' | 'incorrect'>('neutral')
  // Countdown for timed mode; null in classic mode. The clock runs continuously,
  // including during the answer-reveal animation.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    mode === 'timed' ? timeLimit : null
  )

  useEffect(() => {
    if (mode !== 'timed' || secondsLeft === null) return
    if (secondsLeft <= 0) {
      dispatch({ type: 'TIME_UP' })
      return
    }
    const id = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(id)
  }, [mode, secondsLeft, dispatch])

  // When the pool is filtered to specific groups, show the current product's
  // own group (it changes as you move across the selected groups).
  const selectedCategoryName =
    selectedCategories.length > 0 ? currentLeft?.categoryName ?? null : null

  const handleAnswer = useCallback(
    (guess: 'higher' | 'lower') => {
      if (answered || !currentLeft || !currentRight) return

      const correct = evaluateAnswer(currentLeft, currentRight, guess)
      setAnswered(true)
      setRevealVariant(correct ? 'correct' : 'incorrect')

      dispatch({ type: 'ANSWER', guess })

      setTimeout(() => {
        // If game is over, the reducer already moved to game_over — nothing to do
        // If game continues, pick next product and advance round
        const nextProduct = pickNextProduct(activePool, currentRight)
        dispatch({ type: 'NEXT_ROUND', nextProduct })
        setAnswered(false)
        setRevealVariant('neutral')
      }, REVEAL_DELAY_MS)
    },
    [answered, currentLeft, currentRight, activePool, dispatch]
  )

  if (!currentLeft || !currentRight) return null

  return (
    <div className={styles.screen} data-testid="game-screen">
      <HUD
        lives={lives}
        streak={streak}
        mode={mode}
        secondsLeft={secondsLeft}
        category={selectedCategoryName}
      />

      <div className={styles.cards}>
        <ProductCard
          product={currentLeft}
          revealed={true}
          variant="neutral"
          position="left"
        />

        <div className={styles.vsLabel}>VS</div>

        <ProductCard
          product={currentRight}
          revealed={answered}
          variant={answered ? revealVariant : 'neutral'}
          position="right"
        />
      </div>

      <AnswerButtons onAnswer={handleAnswer} disabled={answered} />
    </div>
  )
}
