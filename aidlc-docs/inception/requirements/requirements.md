# Requirements Document
# Krónan Higher or Lower Game

## Intent Analysis Summary

- **User Request**: Build a clone of the Higher or Lower game (higherlowergame.com) but instead of Google search volumes, players compare price-per-unit/weight of grocery products sold at Krónan (Icelandic supermarket chain), using their public REST API.
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: Multiple Components (data pipeline, React frontend, game engine, state management)
- **Complexity Estimate**: Moderate — clear game concept, third-party API integration, two gameplay modes, lives system

---

## Glossary

| Term | Definition |
|---|---|
| Krónan API | The Krónan Public REST API at `api.kronan.is/api/v1` |
| Product dataset | A pre-generated static JSON file produced by a build-time data pipeline querying the Krónan API |
| SKU | Stock Keeping Unit — unique product identifier in the Krónan system |
| Price per unit | Normalized price: price per kg, per litre, per piece, etc. as returned or derivable from the Krónan API |
| Round | A single comparison: two products shown, player guesses which has the higher price-per-unit |
| Streak | The count of consecutive correct answers in the current game session |
| Life | A single chance to answer incorrectly before losing a life; game ends when all lives are lost |
| Normal Mode | Game mode with 3 lives |
| Hard Mode | Game mode with 1 life |
| Game Over | State reached when all lives are exhausted |
| Category | A Krónan product category (e.g. dairy, meat, beverages) used to filter product selection |

---

## Functional Requirements

### FR-01: Data Pipeline (Build-Time)

**Description**: A standalone script queries the Krónan Public API at build/setup time and produces a static `products.json` file. The React frontend never calls the Krónan API at runtime.

**Acceptance Criteria**:
1. A Node.js (or TypeScript) script exists that can be run manually (`npm run fetch-data` or similar).
2. The script authenticates to the Krónan API using an `AccessToken` read from an environment variable (`KRONAN_API_TOKEN`).
3. The script fetches products from the Krónan API using the search and/or category endpoints.
4. Only products that meet ALL of the following criteria are included in `products.json`:
   - Has at least one product image URL.
   - Has a known, non-zero price in ISK.
   - Has a computable price-per-unit value (price per kg, per litre, or per unit as available).
5. Each product record in `products.json` includes: SKU, name (Icelandic), category name (Icelandic), image URL, price (ISK), unit type, and price-per-unit value.
6. The script supports fetching products across the entire catalog (all categories).
7. The script outputs a summary to stdout: total products fetched, total products included after filtering, and total excluded with reason counts.
8. The generated `products.json` is placed in the frontend's `public/` or `src/data/` directory so it is bundled or served statically.

---

### FR-02: Product Selection Per Round

**Description**: Each game round presents two products to compare. Product selection can be random across the entire catalog or filtered to a specific category.

**Acceptance Criteria**:
1. Before starting a game, the player can choose:
   - **Allt** (All) — products selected randomly from the full dataset.
   - **Flokkur** (Category) — products selected randomly from a specific category chosen by the player.
2. When "Flokkur" is selected, a list of available categories (derived from `products.json`) is shown for the player to pick from.
3. Each round selects exactly 2 distinct products at random from the active pool.
4. The same product cannot appear twice in the same round (no self-comparison).
5. Products with missing images or missing price-per-unit values are excluded from selection at runtime (defence-in-depth, even though the pipeline already filters).

---

### FR-03: Core Game Mechanic — Price Per Unit Comparison

**Description**: Players are shown two products and must guess which one has the higher price per unit (e.g. per kg or per litre).

**Acceptance Criteria**:
1. Each round displays two product cards side by side (or stacked on mobile).
2. Each product card shows: product image, product name, category, and unit type (e.g. "kr/kg").
3. The price-per-unit of the LEFT product (the "known" item) is always revealed.
4. The price-per-unit of the RIGHT product (the "mystery" item) is hidden behind a "?" until the player answers.
5. The player selects either **Hærra** (Higher) or **Lægra** (Lower) to indicate whether the right product's price-per-unit is higher or lower than the left product's.
6. After the player answers:
   - The hidden price-per-unit of the right product is revealed with an animation.
   - Visual feedback indicates whether the answer was correct (green) or incorrect (red).
   - If correct, the right product slides left and becomes the new "known" item for the next round, and a new mystery product appears on the right.
7. If two products have an equal price-per-unit, the round is treated as a correct answer for the player.

---

### FR-04: Lives System and Game Modes

**Description**: The game supports two difficulty modes that differ only in the number of lives available.

**Acceptance Criteria**:
1. Before starting, the player selects a game mode:
   - **Venjulegur** (Normal) — 3 lives.
   - **Erfiður** (Hard) — 1 life.
2. Lives are displayed as icons (e.g. hearts) in the game UI, showing remaining and lost lives.
3. Each incorrect answer costs the player 1 life.
4. When the player loses all lives, the **Game Over** screen is shown.
5. The selected game mode is preserved for the duration of the session (until the player starts a new game or refreshes).

---

### FR-05: Streak Tracking

**Description**: The game tracks how many consecutive correct answers the player achieves in the current session.

**Acceptance Criteria**:
1. A streak counter is visible at all times during active gameplay.
2. The streak increments by 1 for each correct answer.
3. The streak resets to 0 when the player loses a life (incorrect answer).
4. The streak is NOT reset when a life is lost — only the current streak at game over is final. *(Correction: streak resets on wrong answer since each wrong answer loses a life; streak is the count of correct answers since the last wrong answer.)*
5. The player's **best streak** for the current browser session is stored in `localStorage` and displayed on the Game Over screen.
6. The best streak persists across page refreshes within the same browser.

---

### FR-06: Game Over Screen

**Description**: When all lives are exhausted, the game ends and a summary screen is shown.

**Acceptance Criteria**:
1. The Game Over screen displays:
   - The player's final streak (correct answers since last wrong answer).
   - The player's best streak (from localStorage).
   - The product comparison that caused the final wrong answer, with both prices revealed.
2. A **Spila aftur** (Play Again) button is shown that restarts the game with the same mode and category settings.
3. A **Breyta stillingum** (Change Settings) button/link is shown to return to the mode/category selection screen.

---

### FR-07: Category Selection UI

**Description**: Players can optionally filter the game to a specific product category.

**Acceptance Criteria**:
1. A category picker is shown on the pre-game settings screen.
2. Categories are derived dynamically from the `products.json` dataset (no hardcoded list).
3. Only categories with at least 2 eligible products are shown (minimum required to play).
4. The selected category is displayed in the game HUD during active play.
5. If "Allt" is selected, no category label is shown in the HUD.

---

### FR-08: Language — Icelandic

**Description**: The entire UI is in Icelandic.

**Acceptance Criteria**:
1. All UI labels, buttons, instructions, and messages are in Icelandic.
2. Product names and category names as returned by the Krónan API (which are in Icelandic) are displayed as-is.
3. No English language option is required.

---

### FR-09: Product Image Display

**Description**: Product images are shown on each product card throughout the game.

**Acceptance Criteria**:
1. Each product card always displays the product image.
2. If an image URL fails to load at runtime, a neutral placeholder image is shown.
3. Images are displayed at a consistent, fixed aspect ratio (e.g. 1:1 square or 4:3).
4. The data pipeline ensures only products with known image URLs enter the dataset, minimising placeholder usage.

---

### FR-10: Start Screen / Home

**Description**: The game has an introductory start screen that explains the concept and lets the player configure settings before playing.

**Acceptance Criteria**:
1. The start screen displays the game title and a brief Icelandic description of the game concept.
2. The player can select game mode (Normal / Hard) on this screen.
3. The player can select product scope (All / Category) on this screen.
4. A **Hefja leik** (Start Game) button starts the game with the selected settings.
5. The start screen is also shown after completing a game if the player chooses "Change Settings".

---

## Non-Functional Requirements

### NFR-01: Local Development

The application must be straightforward to run locally with minimal setup.

**Acceptance Criteria**:
1. The project can be started with `npm install` followed by `npm run dev` (or equivalent).
2. The data pipeline script can be run with a single command (e.g. `npm run fetch-data`).
3. A `README.md` documents all setup steps, including how to obtain a Krónan API token and how to run the data pipeline.
4. The application runs without errors in the latest stable version of Node.js (LTS).

### NFR-02: Functional Correctness

**Acceptance Criteria**:
1. Price-per-unit comparisons are mathematically correct (no rounding errors that flip the result).
2. The lives counter never goes below 0 or above the mode maximum.
3. The streak counter never goes negative.
4. The best streak in localStorage is never overwritten with a lower value.

### NFR-03: Data Freshness

**Acceptance Criteria**:
1. The data pipeline can be re-run at any time to refresh `products.json` with updated prices from the Krónan API.
2. The README documents how often to re-run the pipeline (recommendation: before each deployment or weekly).

---

## Technical Constraints

- **Frontend**: React with TypeScript.
- **Data source at runtime**: Static `products.json` (no runtime calls to Krónan API from the browser).
- **Data pipeline**: Node.js/TypeScript script calling `api.kronan.is/api/v1` with an `AccessToken`.
- **Authentication**: `KRONAN_API_TOKEN` environment variable used only by the data pipeline script.
- **Storage**: `localStorage` for best streak only. No database, no user accounts.
- **UI language**: Icelandic only.
- **Security extension**: Disabled (PoC/prototype).
- **Property-Based Testing extension**: Disabled.
- **Deployment target**: Local development only (for now).
- **Krónan API rate limit**: 200 requests per 200 seconds — pipeline must respect this.

---

## Out of Scope

- User accounts or authentication in the game UI.
- Global leaderboard.
- English language support.
- Real-time price updates during gameplay.
- Comparing raw ISK price (price-per-unit only).
- Payment or checkout functionality.
- Mobile app (web only).
