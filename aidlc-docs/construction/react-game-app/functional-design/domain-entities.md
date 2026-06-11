# Domain Entities — Unit 2: React Game Application

---

## Entity: GameProduct

The canonical product record loaded from `products.json`. Immutable at runtime.

| Field | Type | Description |
|---|---|---|
| sku | string | Unique product identifier |
| name | string | Icelandic product name |
| categorySlug | string | Machine-readable category identifier |
| categoryName | string | Icelandic category display name |
| imageUrl | string | Product image URL |
| priceIsk | number | Raw price in ISK (integer) |
| pricePerUnit | number | Normalised price per unit (integer ISK) |
| unitLabel | string | Display label e.g. "kr/kg", "kr/l", "kr/stk" |

---

## Entity: GameMode

Determines the number of lives for a game session.

| Value | Lives | Icelandic Label |
|---|---|---|
| `'normal'` | 3 | Venjulegur |
| `'hard'` | 1 | Erfiður |

---

## Entity: GamePhase

The current phase of the game, which drives which view is rendered.

| Value | View Rendered | Description |
|---|---|---|
| `'setup'` | SetupScreen | Player configures mode and category |
| `'playing'` | GameScreen | Active game round in progress |
| `'game_over'` | GameOverScreen | All lives exhausted |

---

## Entity: GameState

The complete, authoritative state of the game at any point in time. Owned by `gameReducer`.

| Field | Type | Initial Value | Description |
|---|---|---|---|
| phase | GamePhase | `'setup'` | Active view |
| mode | GameMode | `'normal'` | Selected difficulty |
| selectedCategory | string \| null | `null` | Active category filter (null = all) |
| lives | number | 0 | Current remaining lives (set on START_GAME) |
| maxLives | number | 0 | Max lives for current mode (set on START_GAME) |
| streak | number | 0 | Consecutive correct answers since last wrong |
| bestStreak | number | (from localStorage) | All-time best streak |
| currentLeft | GameProduct \| null | null | The "known" product (price revealed) |
| currentRight | GameProduct \| null | null | The "mystery" product (price hidden) |
| lastRound | LastRound \| null | null | Snapshot of the round that ended the game |
| activePool | GameProduct[] | [] | Products available for the current game session |

---

## Entity: LastRound

A snapshot of the product pair from the game-ending round.

| Field | Type | Description |
|---|---|---|
| left | GameProduct | The "known" product from the final round |
| right | GameProduct | The "mystery" product from the final round |
| guess | 'higher' \| 'lower' | The player's incorrect guess |

---

## Entity: Category

A derived view of available product categories, built from the `products.json` dataset.

| Field | Type | Description |
|---|---|---|
| slug | string | Machine-readable identifier |
| name | string | Icelandic display name |
| productCount | number | Number of eligible products in this category |

---

## Entity: AnswerResult

The outcome of evaluating a player's guess for a single round.

| Field | Type | Description |
|---|---|---|
| correct | boolean | Whether the guess was correct |
| livesRemaining | number | Lives after applying this result |
| newStreak | number | Streak value after applying this result |
| newBestStreak | number | Best streak after applying this result |
| gameOver | boolean | True when livesRemaining reaches 0 |

---

## Entity: GameAction

All possible actions that can be dispatched to the game reducer.

| Action Type | Payload | Description |
|---|---|---|
| `START_GAME` | mode, category, initialLeft, initialRight, activePool | Begin a new game |
| `ANSWER` | guess: 'higher' \| 'lower' | Player submits an answer |
| `NEXT_ROUND` | nextProduct: GameProduct | Advance to the next round (called after reveal animation) |
| `PLAY_AGAIN` | initialLeft, initialRight, activePool | Restart with same settings |
| `CHANGE_SETTINGS` | — | Return to setup screen |
| `SET_BEST_STREAK` | bestStreak: number | Initialise best streak from localStorage on app mount |
