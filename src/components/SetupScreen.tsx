import { useState } from 'react'
import { CategoryPicker } from './CategoryPicker.js'
import { useGameState } from '../context/GameStateProvider.js'
import { buildPool, pickInitialPair } from '../services/productPoolService.js'
import type { GameMode } from '../types/index.js'
import styles from './SetupScreen.module.css'

export function SetupScreen() {
  const { state, dispatch } = useGameState()
  const [mode, setMode] = useState<GameMode>('normal')
  const [scope, setScope] = useState<'all' | 'category'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const canStart = scope === 'all' || selectedCategory !== null

  function handleStart() {
    const category = scope === 'all' ? null : selectedCategory
    const allProducts = (window as unknown as { __products: typeof state.activePool }).__products ?? []
    const activePool = buildPool(allProducts, category)
    if (activePool.length < 2) return
    const { left, right } = pickInitialPair(activePool)
    dispatch({
      type: 'START_GAME',
      mode,
      category,
      initialLeft: left,
      initialRight: right,
      activePool,
    })
  }

  return (
    <div className={styles.screen} data-testid="setup-screen">
      <header className={styles.header}>
        <h1 className={styles.title}>Hærra eða Lægra?</h1>
        <p className={styles.subtitle}>
          Giskaðu á hvaða vara er dýrari á einingarverði!
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Velja erfiðleikastig</h2>
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeBtn} ${mode === 'normal' ? styles.active : ''}`}
            onClick={() => setMode('normal')}
            data-testid="mode-normal"
            aria-pressed={mode === 'normal'}
          >
            Venjulegur
            <span className={styles.modeSub}>3 líf</span>
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'hard' ? styles.active : ''}`}
            onClick={() => setMode('hard')}
            data-testid="mode-hard"
            aria-pressed={mode === 'hard'}
          >
            Erfiður
            <span className={styles.modeSub}>1 líf</span>
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Velja vörur</h2>
        <div className={styles.scopeButtons}>
          <button
            className={`${styles.scopeBtn} ${scope === 'all' ? styles.active : ''}`}
            onClick={() => { setScope('all'); setSelectedCategory(null) }}
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
            Eftir flokki
          </button>
        </div>

        {scope === 'category' && (
          <CategoryPicker
            products={(window as unknown as { __products: typeof state.activePool }).__products ?? []}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
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
