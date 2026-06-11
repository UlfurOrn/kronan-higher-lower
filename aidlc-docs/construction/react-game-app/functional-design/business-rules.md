# Business Rules — Unit 2: React Game Application

---

## BR-01: Game Mode Rules

### BR-01-A: Lives per mode
- Normal mode (`'normal'`): `maxLives = 3`
- Hard mode (`'hard'`): `maxLives = 1`

### BR-01-B: Mode is immutable during a session
- The selected mode cannot be changed while a game is in progress
- Mode can only be changed by returning to the setup screen

---

## BR-02: Product Pool Rules

### BR-02-A: All categories pool
- When `selectedCategory === null` ("Allt"), the active pool is all products in `products.json` that have a non-empty `imageUrl` and `pricePerUnit > 0`

### BR-02-B: Category-filtered pool
- When `selectedCategory` is a category slug, the active pool is all products in `products.json` where `product.categorySlug === selectedCategory`, that also have a non-empty `imageUrl` and `pricePerUnit > 0`

### BR-02-C: Minimum pool size
- A category is only shown in the category picker if it has at least 2 eligible products
- If the active pool has fewer than 2 products, the game cannot start (Start button disabled)

### BR-02-D: Round pair uniqueness
- The two products shown in a round must be distinct (different SKUs)
- A product cannot be compared against itself

### BR-02-E: No repeat of the current left product
- When picking the next mystery product (right), it must not be the same SKU as `currentLeft`

---

## BR-03: Answer Evaluation Rules

### BR-03-A: Correct answer — higher
- The player guesses `'higher'`
- Answer is correct if: `currentRight.pricePerUnit >= currentLeft.pricePerUnit`
- (equal prices count as correct for the player)

### BR-03-B: Correct answer — lower
- The player guesses `'lower'`
- Answer is correct if: `currentRight.pricePerUnit <= currentLeft.pricePerUnit`
- (equal prices count as correct for the player)

### BR-03-C: Incorrect answer
- Any case not covered by BR-03-A or BR-03-B is incorrect

### BR-03-D: Equal price rule
- When `currentRight.pricePerUnit === currentLeft.pricePerUnit`, both `'higher'` and `'lower'` guesses are treated as correct
- Rationale: it is unreasonable to penalise the player for an unwinnable round

---

## BR-04: Lives Rules

### BR-04-A: Life deduction
- Each incorrect answer deducts exactly 1 life: `lives = lives - 1`

### BR-04-B: Lives floor
- `lives` can never go below 0

### BR-04-C: Game over trigger
- When `lives === 0` after a deduction, the game transitions to phase `'game_over'`

### BR-04-D: Correct answer has no life effect
- Correct answers do not change the lives count

---

## BR-05: Streak Rules

### BR-05-A: Streak increment
- Each correct answer increments the streak: `streak = streak + 1`

### BR-05-B: Streak reset
- An incorrect answer resets the streak to 0: `streak = 0`
- The reset happens after the life deduction (i.e., it applies whether or not the game ends)

### BR-05-C: Best streak update
- After each correct answer: `bestStreak = Math.max(bestStreak, streak)`
- The best streak is updated with the NEW streak value (after incrementing)

### BR-05-D: Best streak persistence
- `bestStreak` is read from `localStorage` on app mount
- `bestStreak` is written to `localStorage` whenever it increases
- If `localStorage` is unavailable, `bestStreak` is tracked in-memory only (no error thrown)

### BR-05-E: Best streak floor
- `bestStreak` can never be overwritten with a lower value

---

## BR-06: Round Advancement Rules

### BR-06-A: Correct answer advancement
- After a correct answer and the reveal animation completes:
  - `currentLeft` becomes the previous `currentRight`
  - `currentRight` becomes a new randomly selected product from the active pool (not equal to new `currentLeft`)

### BR-06-B: Incorrect answer — game not over
- If the player answers incorrectly but has lives remaining (Normal mode after 1st or 2nd wrong answer):
  - The round still advances using the same BR-06-A rule
  - The streak resets to 0

### BR-06-C: Incorrect answer — game over
- When `lives` reaches 0 after deduction:
  - `lastRound` is captured: `{ left: currentLeft, right: currentRight, guess }`
  - Phase transitions to `'game_over'`
  - No new product is picked

### BR-06-D: Animation gate
- The `NEXT_ROUND` action is only dispatched after the reveal animation completes
- Answer buttons are disabled from the moment `ANSWER` is dispatched until after `NEXT_ROUND` is dispatched

---

## BR-07: Category Picker Rules

### BR-07-A: Eligible categories only
- Only categories with ≥ 2 eligible products are shown

### BR-07-B: Category list is derived at runtime
- The list is built dynamically from `products.json` — no hardcoded categories

### BR-07-C: "Allt" is always available
- The "Allt" (All categories) option is always the first and default option

---

## BR-08: localStorage Rules

### BR-08-A: Key name
- localStorage key: `kronan_best_streak`

### BR-08-B: Value format
- Stored as a plain integer string (e.g. `"42"`)
- On read: `parseInt(value, 10)`, fallback to `0` if NaN or missing

### BR-08-C: Availability check
- Wrap all localStorage access in try/catch to handle SecurityError (private browsing, storage quota exceeded)
- On error: operate with in-memory value, do not throw

---

## BR-09: Play Again Rules

### BR-09-A: Play Again restarts with same settings
- Mode and category selection are preserved
- A fresh random pair is selected from the active pool
- Lives are reset to `maxLives`
- Streak is reset to 0
- Best streak is preserved

### BR-09-B: Change Settings returns to setup
- All game state is cleared except `bestStreak`
- Phase returns to `'setup'`
