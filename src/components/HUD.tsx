import styles from './HUD.module.css'

interface HUDProps {
  lives: number
  maxLives: number
  streak: number
  category: string | null
}

export function HUD({ lives, maxLives, streak, category }: HUDProps) {
  return (
    <div className={styles.hud} data-testid="hud">
      <div className={styles.lives}>
        {Array.from({ length: maxLives }).map((_, i) => (
          <span key={i} className={styles.heart} aria-label={i < lives ? 'líf' : 'týnt líf'}>
            {i < lives ? '❤️' : '🤍'}
          </span>
        ))}
      </div>
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
