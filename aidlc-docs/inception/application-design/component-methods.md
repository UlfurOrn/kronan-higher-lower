# Component Methods
# Krónan Higher or Lower Game

---

## Unit 1: Data Pipeline

### KronanApiClient

```typescript
// Fetch all top-level categories
fetchCategories(): Promise<KronanCategory[]>

// Fetch all products in a category (handles pagination internally)
fetchProductsByCategory(categorySlug: string): Promise<KronanRawProduct[]>

// Search all products across the catalog (handles pagination internally)
fetchAllProducts(): Promise<KronanRawProduct[]>

// Internal: throttled GET/POST with rate-limit handling
private request<T>(method: 'GET' | 'POST', path: string, body?: object): Promise<T>
```

### ProductFilter

```typescript
// Returns true if product meets all eligibility criteria
isEligible(product: KronanRawProduct, pricePerUnit: PricePerUnitResult | null): boolean

// Returns a human-readable rejection reason (for pipeline summary)
getRejectionReason(product: KronanRawProduct, pricePerUnit: PricePerUnitResult | null): string
```

### PricePerUnitCalculator

```typescript
// Compute normalised price-per-unit from a raw product record
// Returns null if computation is not possible
compute(product: KronanRawProduct): PricePerUnitResult | null

// Internal: parse unit type string from product data
private parseUnitType(product: KronanRawProduct): UnitType | null
```

### ProductDatasetWriter

```typescript
// Write filtered products to products.json at the configured output path
write(products: GameProduct[], outputPath: string): Promise<void>

// Print pipeline summary to stdout
printSummary(summary: PipelineSummary): void
```

### PipelineOrchestrator

```typescript
// Main entry point — run the full pipeline
run(): Promise<void>

// Internal: validate environment (KRONAN_API_TOKEN present)
private validateEnv(): void
```

---

## Unit 2: React Game Application

### GameStateProvider / Reducer

```typescript
// Reducer — pure function, handles all state transitions
gameReducer(state: GameState, action: GameAction): GameState

// Action creators
startGame(mode: GameMode, category: string | null, products: GameProduct[]): StartGameAction
submitAnswer(guess: 'higher' | 'lower'): AnswerAction
advanceRound(nextProduct: GameProduct): NextRoundAction
playAgain(products: GameProduct[]): PlayAgainAction
changeSettings(): ChangeSettingsAction
```

### GameStateProvider (hook)

```typescript
// Custom hook — access game state and dispatch from any child component
useGameState(): { state: GameState; dispatch: Dispatch<GameAction> }
```

### SetupScreen

```typescript
// Render the setup/configuration screen
SetupScreen(): JSX.Element

// Internal: handle mode selection change
handleModeChange(mode: GameMode): void

// Internal: handle scope selection change ('all' | 'category')
handleScopeChange(scope: 'all' | 'category'): void

// Internal: handle category selection from CategoryPicker
handleCategorySelect(categorySlug: string): void

// Internal: handle Start Game button press
handleStartGame(): void
```

### CategoryPicker

```typescript
// Render category list derived from products dataset
CategoryPicker(props: { products: GameProduct[]; onSelect: (slug: string) => void; selected: string | null }): JSX.Element

// Internal: derive unique categories with ≥ 2 products
deriveEligibleCategories(products: GameProduct[]): Category[]
```

### GameScreen

```typescript
// Render the active game round
GameScreen(): JSX.Element

// Internal: handle player answer submission
handleAnswer(guess: 'higher' | 'lower'): void

// Internal: called after reveal animation completes
handleRevealComplete(wasCorrect: boolean): void

// Internal: pick a random product from the active pool (excluding current pair)
pickNextProduct(pool: GameProduct[], exclude: GameProduct[]): GameProduct
```

### ProductCard

```typescript
// Render a single product card
ProductCard(props: {
  product: GameProduct;
  revealed: boolean;
  variant: 'neutral' | 'correct' | 'incorrect';
  isKnown: boolean;
}): JSX.Element
```

### HUD

```typescript
// Render the in-game heads-up display
HUD(props: {
  lives: number;
  maxLives: number;
  streak: number;
  category: string | null;
}): JSX.Element
```

### AnswerButtons

```typescript
// Render Higher/Lower answer buttons
AnswerButtons(props: {
  onAnswer: (guess: 'higher' | 'lower') => void;
  disabled: boolean;
}): JSX.Element
```

### GameOverScreen

```typescript
// Render the game over summary screen
GameOverScreen(): JSX.Element

// Internal: handle Play Again button press
handlePlayAgain(): void

// Internal: handle Change Settings button press
handleChangeSettings(): void
```

### ProductImage

```typescript
// Render product image with fallback
ProductImage(props: {
  src: string;
  alt: string;
  className?: string;
}): JSX.Element

// Internal: handle image load error
handleError(e: React.SyntheticEvent<HTMLImageElement>): void
```

---

## Shared Types / Data Models

```typescript
// Canonical product record stored in products.json and used at runtime
interface GameProduct {
  sku: string;
  name: string;                  // Icelandic product name
  categorySlug: string;
  categoryName: string;          // Icelandic category name
  imageUrl: string;
  priceIsk: number;              // Price in ISK (integer)
  pricePerUnit: number;          // Normalised price per unit (integer ISK)
  unitLabel: string;             // e.g. "kr/kg", "kr/l", "kr/stk"
}

// Result of price-per-unit computation
interface PricePerUnitResult {
  value: number;
  unitLabel: string;
}

// Unit types supported
type UnitType = 'kg' | 'litre' | 'piece' | 'unknown';

// Game mode
type GameMode = 'normal' | 'hard';

// Game phase (drives which view is rendered)
type GamePhase = 'setup' | 'playing' | 'game_over';

// Full game state
interface GameState {
  phase: GamePhase;
  mode: GameMode;
  selectedCategory: string | null;
  lives: number;
  maxLives: number;
  streak: number;
  bestStreak: number;
  currentLeft: GameProduct | null;
  currentRight: GameProduct | null;
  lastRound: { left: GameProduct; right: GameProduct } | null;
  activePool: GameProduct[];
}

// Pipeline summary
interface PipelineSummary {
  totalFetched: number;
  totalIncluded: number;
  totalExcluded: number;
  exclusionReasons: Record<string, number>;
}

// Raw product shape from Krónan API (subset of fields we care about)
interface KronanRawProduct {
  sku: string;
  name: string;
  category: { slug: string; name: string } | null;
  images: { url: string }[];
  price: number | null;
  unit: string | null;
  unitSize: number | null;
}

// Krónan category
interface KronanCategory {
  slug: string;
  name: string;
}

// All possible game actions
type GameAction =
  | { type: 'START_GAME'; mode: GameMode; category: string | null; products: GameProduct[] }
  | { type: 'ANSWER'; guess: 'higher' | 'lower' }
  | { type: 'NEXT_ROUND'; nextProduct: GameProduct }
  | { type: 'PLAY_AGAIN'; products: GameProduct[] }
  | { type: 'CHANGE_SETTINGS' };
```
