# Components
# Krónan Higher or Lower Game

---

## System Overview

The system consists of two top-level units:

1. **Data Pipeline** — A standalone Node.js/TypeScript CLI script (build-time only)
2. **React Game Application** — A client-side SPA (runtime, browser)

---

## Unit 1: Data Pipeline

### Component: KronanApiClient
- **Purpose**: Wraps all HTTP communication with the Krónan REST API
- **Responsibilities**:
  - Authenticate requests using `KRONAN_API_TOKEN` from environment
  - Fetch all product categories from `GET /api/v1/categories/`
  - Fetch products within a category from `GET /api/v1/categories/{slug}/products/`
  - Search products using `POST /api/v1/products/search/`
  - Handle pagination (limit/offset)
  - Respect the Krónan API rate limit (200 req / 200 sec) with throttling

### Component: ProductFilter
- **Purpose**: Applies eligibility rules to raw API product records
- **Responsibilities**:
  - Reject products with no image URL
  - Reject products with zero or null price
  - Reject products where price-per-unit cannot be computed
  - Return only products that pass all three criteria

### Component: PricePerUnitCalculator
- **Purpose**: Derives the normalised price-per-unit value from a raw product record
- **Responsibilities**:
  - Parse unit type from product data (kg, litre, piece, etc.)
  - Compute price-per-unit as `price / quantity` where applicable
  - Return a structured `{ value: number, unitLabel: string }` result
  - Return `null` when computation is not possible (triggers filter rejection)

### Component: ProductDatasetWriter
- **Purpose**: Serialises the filtered, enriched product list to `products.json`
- **Responsibilities**:
  - Map each eligible product to the canonical `GameProduct` schema
  - Write the JSON file to the configured output path (`src/data/products.json`)
  - Print a pipeline summary to stdout (total fetched, included, excluded by reason)

### Component: PipelineOrchestrator
- **Purpose**: Entry point — coordinates the full pipeline run
- **Responsibilities**:
  - Read `KRONAN_API_TOKEN` from environment; abort with a clear error if missing
  - Invoke `KronanApiClient` to fetch all products across all categories
  - Pass raw products through `ProductFilter` and `PricePerUnitCalculator`
  - Pass eligible products to `ProductDatasetWriter`
  - Exit with code 0 on success, non-zero on failure

---

## Unit 2: React Game Application

### Component: App
- **Purpose**: Root component — provides global state context and renders the active view
- **Responsibilities**:
  - Initialise `GameStateProvider` with the product dataset
  - Read best streak from `localStorage` on mount
  - Render the correct top-level view based on `gamePhase` state

### Component: GameStateProvider (Context + Reducer)
- **Purpose**: Central game state machine — owns all mutable game state
- **Responsibilities**:
  - Manage `gamePhase`: `'setup' | 'playing' | 'game_over'`
  - Manage `gameMode`: `'normal' | 'hard'`
  - Manage `selectedCategory`: `string | null`
  - Manage `lives`: current remaining lives
  - Manage `streak`: current consecutive correct answers
  - Manage `bestStreak`: all-time best streak (synced with localStorage)
  - Manage `currentLeft` and `currentRight`: the two active `GameProduct` records
  - Manage `lastRound`: snapshot of the losing round (for Game Over screen)
  - Dispatch actions: `START_GAME`, `ANSWER`, `NEXT_ROUND`, `PLAY_AGAIN`, `CHANGE_SETTINGS`

### Component: SetupScreen
- **Purpose**: Pre-game configuration screen (Icelandic start screen)
- **Responsibilities**:
  - Display game title and brief game description in Icelandic
  - Render mode selector: Venjulegur (Normal, 3 lives) / Erfiður (Hard, 1 life)
  - Render scope selector: Allt (All) / Flokkur (Category)
  - When Flokkur is selected, render `CategoryPicker`
  - Render "Hefja leik" (Start Game) button; disabled until a valid selection is made

### Component: CategoryPicker
- **Purpose**: Dropdown/list of available product categories for scope selection
- **Responsibilities**:
  - Derive unique categories from the product dataset at mount time
  - Only display categories with ≥ 2 eligible products
  - Emit selected category slug back to `SetupScreen`

### Component: GameScreen
- **Purpose**: Active gameplay view — renders the current round
- **Responsibilities**:
  - Read `currentLeft`, `currentRight`, `lives`, `streak`, `gameMode`, `selectedCategory` from context
  - Render the `HUD` (lives, streak, category label)
  - Render two `ProductCard` components (left = known, right = mystery)
  - Render `AnswerButtons` (Hærra / Lægra)
  - Orchestrate the reveal animation sequence after an answer is submitted
  - Dispatch `ANSWER` action with the player's guess
  - After animation completes, dispatch `NEXT_ROUND` or transition to `game_over`

### Component: ProductCard
- **Purpose**: Displays a single product in a game round
- **Responsibilities**:
  - Render product image (with fallback placeholder on load error)
  - Render product name and category in Icelandic
  - Render unit label (e.g. "kr/kg")
  - Render price-per-unit value when `revealed={true}`, otherwise render "?"
  - Apply correct/incorrect visual styling after reveal (`variant: 'correct' | 'incorrect' | 'neutral'`)

### Component: HUD (Heads-Up Display)
- **Purpose**: In-game status bar visible throughout active play
- **Responsibilities**:
  - Render lives remaining as heart icons (filled = alive, empty = lost)
  - Render current streak count
  - Render selected category label (hidden when "Allt" is selected)

### Component: AnswerButtons
- **Purpose**: The two interactive answer buttons
- **Responsibilities**:
  - Render "Hærra" (Higher) and "Lægra" (Lower) buttons
  - Disable both buttons once an answer has been submitted (until next round loads)
  - Emit chosen answer (`'higher' | 'lower'`) to `GameScreen`

### Component: GameOverScreen
- **Purpose**: End-of-game summary screen
- **Responsibilities**:
  - Display final streak and best streak (from localStorage)
  - Render the losing `ProductCard` pair with both prices revealed
  - Render "Spila aftur" (Play Again) — restarts with same mode + category
  - Render "Breyta stillingum" (Change Settings) — returns to `SetupScreen`

### Component: ProductImage
- **Purpose**: Reusable image component with fallback handling
- **Responsibilities**:
  - Render product image at a fixed aspect ratio
  - On `onError`, swap to a neutral placeholder SVG/image
  - Accept `alt` text (product name) for accessibility
