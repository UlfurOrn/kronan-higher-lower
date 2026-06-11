# Business Logic Model — Unit 2: React Game Application

---

## Game State Machine

```
                    [App mounts]
                         |
                         v
                    SET_BEST_STREAK
                  (read from localStorage)
                         |
                         v
               +------------------+
               |      setup       |  <-----------+
               |   SetupScreen    |              |
               +------------------+              |
                         |                       |
                   START_GAME                    |
              (mode, category, pair)             |
                         |                       |
                         v                       |
               +------------------+    CHANGE_SETTINGS
               |     playing      | ------------>+
               |   GameScreen     |
               +------------------+
                    |       |
              ANSWER(correct)  ANSWER(wrong, lives>0)
                    |       |
                    |       +---> lives-- , streak=0
                    |             NEXT_ROUND (same flow)
                    |
             streak++ , bestStreak update
                    |
              NEXT_ROUND
             (right becomes left, new right picked)
                    |
           back to [playing] -----> ANSWER(wrong, lives=0)
                                           |
                                           v
                                  +------------------+
                                  |    game_over     |
                                  |  GameOverScreen  |
                                  +------------------+
                                       |       |
                                  PLAY_AGAIN  CHANGE_SETTINGS
                                       |       |
                                       v       v
                                  [playing]  [setup]
```

---

## Algorithm: GameLogicService.evaluateAnswer

```
Input:
  left:  GameProduct   (the known product)
  right: GameProduct   (the mystery product)
  guess: 'higher' | 'lower'

Logic:
  if guess === 'higher':
    correct = (right.pricePerUnit >= left.pricePerUnit)
  if guess === 'lower':
    correct = (right.pricePerUnit <= left.pricePerUnit)

Output: boolean (correct)
```

---

## Algorithm: GameLogicService.applyAnswer

```
Input:
  state:   { lives, streak, bestStreak, maxLives }
  correct: boolean

Logic:
  if correct:
    newStreak     = streak + 1
    newBestStreak = Math.max(bestStreak, newStreak)
    newLives      = lives    // unchanged
    gameOver      = false
  else:
    newStreak     = 0
    newBestStreak = bestStreak   // unchanged on wrong answer
    newLives      = lives - 1
    gameOver      = (newLives === 0)

Output: AnswerResult {
  correct,
  livesRemaining: newLives,
  newStreak,
  newBestStreak,
  gameOver
}
```

---

## Algorithm: GameLogicService.getMaxLives

```
Input:  GameMode
Output: number

normal -> 3
hard   -> 1
```

---

## Algorithm: ProductPoolService.buildPool

```
Input:
  products:  GameProduct[]   (full dataset)
  category:  string | null   (null = all)

Logic:
  1. Filter: keep products where imageUrl is non-empty AND pricePerUnit > 0
  2. If category !== null: further filter where categorySlug === category
  3. Return filtered array

Output: GameProduct[]
```

---

## Algorithm: ProductPoolService.pickInitialPair

```
Input:  pool: GameProduct[]

Precondition: pool.length >= 2

Logic:
  1. left  = pool[randomIndex()]
  2. right = pool[randomIndex() where index !== left's index]
     (retry until distinct SKU found)

Output: { left: GameProduct, right: GameProduct }
```

---

## Algorithm: ProductPoolService.pickNextProduct

```
Input:
  pool:    GameProduct[]
  exclude: GameProduct   (the current left product — must not be repeated)

Logic:
  1. candidates = pool.filter(p => p.sku !== exclude.sku)
  2. If candidates is empty: return exclude (edge case — pool has only 1 product, should not happen due to BR-02-C)
  3. Return candidates[randomIndex()]

Output: GameProduct
```

---

## Algorithm: ProductPoolService.deriveCategories

```
Input:  products: GameProduct[]

Logic:
  1. Group products by categorySlug
  2. For each group: build Category { slug, name, productCount }
  3. Filter: keep only categories where productCount >= 2
  4. Sort: alphabetically by name

Output: Category[]
```

---

## Algorithm: LocalStorageService.readBestStreak

```
Logic:
  try:
    raw = localStorage.getItem('kronan_best_streak')
    if raw is null: return 0
    parsed = parseInt(raw, 10)
    if isNaN(parsed): return 0
    return Math.max(0, parsed)
  catch:
    return 0
```

---

## Algorithm: LocalStorageService.writeBestStreak

```
Input: value: number

Logic:
  try:
    localStorage.setItem('kronan_best_streak', String(value))
  catch:
    // silently ignore (private browsing, quota exceeded)
```

---

## gameReducer: State Transitions

### START_GAME

```
Input action: { type: 'START_GAME', mode, category, initialLeft, initialRight, activePool }

New state:
  phase          = 'playing'
  mode           = action.mode
  selectedCategory = action.category
  maxLives       = GameLogicService.getMaxLives(action.mode)
  lives          = maxLives
  streak         = 0
  bestStreak     = state.bestStreak   // preserved
  currentLeft    = action.initialLeft
  currentRight   = action.initialRight
  activePool     = action.activePool
  lastRound      = null
```

### ANSWER

```
Input action: { type: 'ANSWER', guess }

result = GameLogicService.applyAnswer(state, GameLogicService.evaluateAnswer(currentLeft, currentRight, guess))

if result.gameOver:
  New state:
    phase      = 'game_over'
    lives      = 0
    streak     = result.newStreak     // 0 after wrong
    bestStreak = result.newBestStreak
    lastRound  = { left: currentLeft, right: currentRight, guess }
else:
  New state:
    lives      = result.livesRemaining
    streak     = result.newStreak
    bestStreak = result.newBestStreak
    // currentLeft and currentRight unchanged until NEXT_ROUND
    // (reveal animation plays first)
```

### NEXT_ROUND

```
Input action: { type: 'NEXT_ROUND', nextProduct }

New state:
  currentLeft  = state.currentRight     // right slides to left
  currentRight = action.nextProduct     // new mystery product
```

### PLAY_AGAIN

```
Input action: { type: 'PLAY_AGAIN', initialLeft, initialRight, activePool }

New state:
  phase        = 'playing'
  lives        = state.maxLives         // reset to mode max
  streak       = 0
  bestStreak   = state.bestStreak       // preserved
  currentLeft  = action.initialLeft
  currentRight = action.initialRight
  activePool   = action.activePool
  lastRound    = null
  // mode and selectedCategory unchanged
```

### CHANGE_SETTINGS

```
New state:
  phase            = 'setup'
  lives            = 0
  streak           = 0
  currentLeft      = null
  currentRight     = null
  lastRound        = null
  activePool       = []
  // bestStreak, mode, selectedCategory preserved
```

### SET_BEST_STREAK

```
Input action: { type: 'SET_BEST_STREAK', bestStreak }

New state:
  bestStreak = action.bestStreak
```

---

## Side Effects Model

Side effects are handled outside the pure reducer by `GameStateProvider`:

| Trigger | Side Effect |
|---|---|
| App mount | Read `bestStreak` from localStorage, dispatch `SET_BEST_STREAK` |
| `ANSWER` results in new `bestStreak > prev` | Write new `bestStreak` to localStorage |
| `START_GAME` dispatched | Call `ProductPoolService.buildPool()` + `pickInitialPair()` to derive pool and initial pair before dispatching |
| `PLAY_AGAIN` dispatched | Call `ProductPoolService.pickInitialPair()` to get fresh pair before dispatching |
| `NEXT_ROUND` dispatched | Call `ProductPoolService.pickNextProduct()` to pick next product before dispatching |
