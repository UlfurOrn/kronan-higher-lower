import type { GameMode } from '../types/index.js'
import styles from './HUD.module.css'

interface HUDProps {
  lives: number
  streak: number
  mode: GameMode
  secondsLeft: number | null
  category: string | null
}

export function HUD({ lives, streak, mode, secondsLeft, category }: HUDProps) {
  return (
    <div className={styles.hud} data-testid="hud">
      <div className={styles.lives}>
        <span className={styles.heart} aria-label={lives > 0 ? 'líf' : 'týnt líf'}>
          {lives > 0 ? '❤️' : '🤍'}
        </span>
      </div>

      {mode === 'timed' && secondsLeft !== null && (
        <div
          className={`${styles.timer} ${secondsLeft <= 5 ? styles.timerLow : ''}`}
          data-testid="timer"
        >
          ⏱ <span>{secondsLeft}</span>
        </div>
      )}

      <div className={styles.streak}>
        🔥 <span>{streak}</span>
      </div>
      {category && (
        <div className={styles.category}>
          <span>{category}</span>
        </div>
      )}
    </div>
  )
}
