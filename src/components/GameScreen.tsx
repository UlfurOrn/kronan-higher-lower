import { useState, useCallback } from 'react'
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
  const { currentLeft, currentRight, lives, maxLives, streak, selectedCategory, activePool } = state

  const [answered, setAnswered] = useState(false)
  const [revealVariant, setRevealVariant] = useState<'neutral' | 'correct' | 'incorrect'>('neutral')

  const selectedCategoryName = selectedCategory
    ? currentLeft?.categoryName ?? selectedCategory
    : null

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
        maxLives={maxLives}
        streak={streak}
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
