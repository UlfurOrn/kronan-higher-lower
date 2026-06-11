// =============================================================================
// Shared types — used by both Unit 1 (pipeline) and Unit 2 (React app)
// =============================================================================

// ---------------------------------------------------------------------------
// Pipeline types (Unit 1)
// ---------------------------------------------------------------------------

/** Raw product record as returned by the Krónan API */
export interface KronanRawProduct {
  sku: string
  name: string
  // Category is NOT in the API response — we attach it after fetching
  category: { slug: string; name: string } | null
  // Image fields from the actual API
  thumbnail: string | null  // small thumbnail URL
  image: string | null      // full-size image URL
  // Price fields
  price: number | null       // ISK price (integer)
  discountedPrice: number | null
  // Price-per-unit fields — the API already computes these
  pricePerKilo: number | null           // price per kg (if applicable)
  baseComparisonUnit: string | null     // e.g. "100g", "l", "stk"
  qtyPerBaseCompUnit: number | null     // quantity per base comparison unit
  chargedByWeight: boolean
  // Other fields
  priceInfo: string | null  // human-readable price info e.g. "398 kr/kg"
  categoryPath: string | null
  brand: string | null
}

/**
 * A product category from the Krónan API.
 * The /categories/ endpoint returns a tree; only leaf categories
 * (those without `children`) accept the /products/ endpoint.
 */
export interface KronanCategory {
  slug: string
  name: string
  children?: KronanCategory[]
}

/** Result of normalising a product's price to a per-unit basis */
export interface PricePerUnitResult {
  value: number
  unitLabel: string
}

/** Supported unit types for normalisation */
export type UnitType = 'kg' | 'litre' | 'piece' | 'unknown'

/** Why a product was excluded from the dataset */
export type RejectionReason =
  | 'NO_IMAGE'
  | 'NO_PRICE'
  | 'NO_PRICE_PER_UNIT'
  | 'NO_CATEGORY'

/** Pipeline run summary printed to stdout */
export interface PipelineSummary {
  totalFetched: number
  totalIncluded: number
  totalExcluded: number
  exclusionReasons: Record<RejectionReason, number>
}

// ---------------------------------------------------------------------------
// Shared contract (Unit 1 output / Unit 2 input)
// ---------------------------------------------------------------------------

/**
 * Canonical product record written to products.json by the pipeline
 * and consumed by the React game at runtime.
 */
export interface GameProduct {
  sku: string
  name: string
  categorySlug: string
  categoryName: string
  imageUrl: string
  priceIsk: number
  pricePerUnit: number
  unitLabel: string
}

// ---------------------------------------------------------------------------
// Game types (Unit 2)
// ---------------------------------------------------------------------------

export type GameMode = 'classic' | 'timed'

export type GamePhase = 'setup' | 'playing' | 'game_over'

/** A derived category entry shown in the CategoryPicker */
export interface Category {
  slug: string
  name: string
  productCount: number
}

/** Snapshot of the losing round stored in game state */
export interface LastRound {
  left: GameProduct
  right: GameProduct
  guess: 'higher' | 'lower'
}

/** The result of evaluating a player's answer */
export interface AnswerResult {
  correct: boolean
  livesRemaining: number
  newStreak: number
  newBestStreak: number
  gameOver: boolean
}

/** Complete game state owned by the reducer */
export interface GameState {
  phase: GamePhase
  mode: GameMode
  selectedCategory: string | null
  lives: number
  maxLives: number
  streak: number
  bestStreak: number
  currentLeft: GameProduct | null
  currentRight: GameProduct | null
  lastRound: LastRound | null
  activePool: GameProduct[]
}

/** All dispatchable game actions */
export type GameAction =
  | {
      type: 'START_GAME'
      mode: GameMode
      category: string | null
      initialLeft: GameProduct
      initialRight: GameProduct
      activePool: GameProduct[]
    }
  | { type: 'ANSWER'; guess: 'higher' | 'lower' }
  | { type: 'NEXT_ROUND'; nextProduct: GameProduct }
  | {
      type: 'PLAY_AGAIN'
      initialLeft: GameProduct
      initialRight: GameProduct
      activePool: GameProduct[]
    }
  | { type: 'CHANGE_SETTINGS' }
  | { type: 'SET_BEST_STREAK'; bestStreak: number }
