import styles from './AnswerButtons.module.css'

interface AnswerButtonsProps {
  onAnswer: (guess: 'higher' | 'lower') => void
  disabled: boolean
}

export function AnswerButtons({ onAnswer, disabled }: AnswerButtonsProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.btn} ${styles.higher}`}
        onClick={() => onAnswer('higher')}
        disabled={disabled}
        data-testid="answer-btn-higher"
        aria-label="Hærra"
      >
        ⬆ Hærra
      </button>
      <button
        className={`${styles.btn} ${styles.lower}`}
        onClick={() => onAnswer('lower')}
        disabled={disabled}
        data-testid="answer-btn-lower"
        aria-label="Lægra"
      >
        ⬇ Lægra
      </button>
    </div>
  )
}
