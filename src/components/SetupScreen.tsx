import { useState } from 'react'
import { CategoryPicker } from './CategoryPicker.js'
import { useGameState } from '../context/GameStateProvider.js'
import { buildPool, pickInitialPair } from '../services/productPoolService.js'
import { TIME_LIMIT_OPTIONS, DEFAULT_TIME_LIMIT } from '../services/gameLogicService.js'
import { readBestScore } from '../services/localStorageService.js'
import type { GameMode } from '../types/index.js'
import qrCode from '../images/qr-code.svg'
import styles from './SetupScreen.module.css'

export function SetupScreen() {
  const { state, dispatch } = useGameState()
  const [mode, setMode] = useState<GameMode>('classic')
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT)
  const [scope, setScope] = useState<'all' | 'category'>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const canStart = scope === 'all' || selectedCategories.length > 0

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  function handleStart() {
    const categories = scope === 'all' ? [] : selectedCategories
    const allProducts = (window as unknown as { __products: typeof state.activePool }).__products ?? []
    const activePool = buildPool(allProducts, categories)
    if (activePool.length < 2) return
    const { left, right } = pickInitialPair(activePool)
    const effectiveTimeLimit = mode === 'timed' ? timeLimit : null
    dispatch({
      type: 'START_GAME',
      mode,
      timeLimit: effectiveTimeLimit,
      categories,
      bestStreak: readBestScore(mode, effectiveTimeLimit),
      initialLeft: left,
      initialRight: right,
      activePool,
    })
  }

  return (
    <div className={styles.screen} data-testid="setup-screen">
      <img
        src={qrCode}
        alt="QR kóði — opna leikinn í síma"
        className={styles.qrCode}
        aria-hidden="true"
      />
      <header className={styles.header}>
        <h1 className={styles.title}>Hærra eða Lægra?</h1>
        <p className={styles.subtitle}>
          Giskaðu á hvaða vara er dýrari á einingarverði!
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Velja leikham</h2>
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeBtn} ${mode === 'classic' ? styles.active : ''}`}
            onClick={() => setMode('classic')}
            data-testid="mode-classic"
            aria-pressed={mode === 'classic'}
          >
            Klassískt
            <span className={styles.modeSub}>1 líf — sem lengst</span>
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'timed' ? styles.active : ''}`}
            onClick={() => setMode('timed')}
            data-testid="mode-timed"
            aria-pressed={mode === 'timed'}
          >
            Á tíma
            <span className={styles.modeSub}>sem flest á tíma</span>
          </button>
        </div>

        {mode === 'timed' && (
          <div className={styles.timeButtons} data-testid="time-options">
            {TIME_LIMIT_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                className={`${styles.timeBtn} ${timeLimit === seconds ? styles.active : ''}`}
                onClick={() => setTimeLimit(seconds)}
                data-testid={`time-${seconds}`}
                aria-pressed={timeLimit === seconds}
              >
                {seconds} sek
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Velja vörur</h2>
        <div className={styles.scopeButtons}>
          <button
            className={`${styles.scopeBtn} ${scope === 'all' ? styles.active : ''}`}
            onClick={() => { setScope('all'); setSelectedCategories([]) }}
            data-testid="scope-all"
            aria-pressed={scope === 'all'}
          >
            Allt
          </button>
          <button
            className={`${styles.scopeBtn} ${scope === 'category' ? styles.active : ''}`}
            onClick={() => setScope('category')}
            data-testid="scope-category"
            aria-pressed={scope === 'category'}
          >
            Eftir flokkum
          </button>
        </div>

        {scope === 'category' && (
          <>
            <CategoryPicker
              products={(window as unknown as { __products: typeof state.activePool }).__products ?? []}
              selected={selectedCategories}
              onToggle={toggleCategory}
            />
            <p className={styles.selectionHint} data-testid="selection-hint">
              {selectedCategories.length === 0
                ? 'Veldu einn eða fleiri flokka'
                : selectedCategories.length === 1
                  ? '1 flokkur valinn'
                  : `${selectedCategories.length} flokkar valdir`}
            </p>
          </>
        )}
      </section>

      <button
        className={styles.startBtn}
        onClick={handleStart}
        disabled={!canStart}
        data-testid="start-btn"
      >
        Hefja leik
      </button>
    </div>
  )
}
