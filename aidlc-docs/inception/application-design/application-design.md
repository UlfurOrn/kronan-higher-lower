# Application Design
# Krónan Higher or Lower Game

## Overview

The system is a two-unit greenfield project:

| Unit | Type | Runtime |
|---|---|---|
| Unit 1: Data Pipeline | Node.js/TypeScript CLI script | Build-time only |
| Unit 2: React Game Application | React + TypeScript SPA | Browser |

The units are coupled only via a single file artifact: `products.json`. The pipeline produces it; the React app consumes it as a static import. No runtime API calls are made from the browser.

---

## Architecture Diagram

```
BUILD TIME                          RUNTIME (Browser)
+------------------------+          +--------------------------------+
|  Data Pipeline Script  |          |  React Game Application        |
|                        |          |                                |
|  PipelineOrchestrator  |          |  App                           |
|    |                   |          |    |                           |
|    +-> KronanApiClient |          |    +-> GameStateProvider       |
|    |   (Kronan API)    |          |    |     (Context + Reducer)   |
|    |                   |          |    |     GameLogicService       |
|    +-> PricePerUnit    |          |    |     ProductPoolService     |
|    |   Calculator      |          |    |     LocalStorageService    |
|    |                   |          |    |                           |
|    +-> ProductFilter   |          |    +-> SetupScreen             |
|    |                   |          |    |     CategoryPicker         |
|    +-> ProductDataset  |          |    |                           |
|        Writer          |          |    +-> GameScreen              |
|          |             |          |    |     HUD                   |
+----------+-------------+          |    |     ProductCard x2        |
           |                        |    |     AnswerButtons         |
           v                        |    |                           |
     products.json  --------------->|    +-> GameOverScreen          |
                                    |          ProductCard x2        |
                                    +--------------------------------+
```

---

## Unit 1: Data Pipeline

### Components

| Component | Responsibility |
|---|---|
| PipelineOrchestrator | Entry point — coordinates full pipeline run, validates env |
| KronanApiClient | HTTP client for Krónan API — auth, pagination, rate limiting |
| PricePerUnitCalculator | Computes normalised price/unit from raw product data |
| ProductFilter | Applies eligibility rules (image + price + price-per-unit) |
| ProductDatasetWriter | Serialises `GameProduct[]` to `products.json`, prints summary |

### Data Flow

```
Krónan API
    --> KronanApiClient --> KronanRawProduct[]
    --> PricePerUnitCalculator (per product) --> PricePerUnitResult | null
    --> ProductFilter --> GameProduct[] (eligible only)
    --> ProductDatasetWriter --> products.json
```

### Key Design Decisions

- **Rate limiting**: Pipeline throttles requests to stay within 200 req / 200 sec; uses a simple token-bucket or sleep-based approach.
- **Price-per-unit computation**: Derived from product `unit` + `unitSize` + `price` fields from the Krónan API. Products where this cannot be computed are excluded.
- **Output schema**: `products.json` is an array of `GameProduct` objects. The schema is the contract between Unit 1 and Unit 2.

---

## Unit 2: React Game Application

### Components

| Component | Responsibility |
|---|---|
| App | Root — provides context, selects active view based on game phase |
| GameStateProvider | Central state machine (useReducer + Context) |
| gameReducer | Pure reducer — all state transitions |
| GameLogicService | Pure logic — evaluate guess, update lives/streak |
| ProductPoolService | Load products.json, build pool, pick random pairs |
| LocalStorageService | Read/write best streak from localStorage |
| SetupScreen | Pre-game config: mode + scope/category selection |
| CategoryPicker | Dynamic category list from dataset |
| GameScreen | Active game round view |
| HUD | In-game status: lives, streak, category |
| ProductCard | Single product display (known or mystery) |
| ProductImage | Image with fallback placeholder |
| AnswerButtons | Hærra / Lægra buttons |
| GameOverScreen | End-of-game summary + replay options |

### Game State Machine

```
         START_GAME
setup ----------------> playing
                           |
                    ANSWER (correct)
                           | (lives > 0 after wrong)
                           v
                        playing (next round)
                           |
                    ANSWER (wrong, last life)
                           v
                        game_over
                           |
               PLAY_AGAIN |  | CHANGE_SETTINGS
                           v  v
                       playing  setup
```

#### State Fields

| Field | Type | Description |
|---|---|---|
| phase | `'setup' \| 'playing' \| 'game_over'` | Active view |
| mode | `'normal' \| 'hard'` | 3 lives or 1 life |
| selectedCategory | `string \| null` | Active category filter |
| lives | `number` | Remaining lives |
| maxLives | `number` | 3 (normal) or 1 (hard) |
| streak | `number` | Consecutive correct answers |
| bestStreak | `number` | All-time best (synced with localStorage) |
| currentLeft | `GameProduct \| null` | The "known" product |
| currentRight | `GameProduct \| null` | The "mystery" product |
| lastRound | `{ left, right } \| null` | Snapshot of the losing round |
| activePool | `GameProduct[]` | Products available for this game |

### View Routing

View rendering is driven entirely by `state.phase` — no router library needed:

```
phase === 'setup'     --> <SetupScreen />
phase === 'playing'   --> <GameScreen />
phase === 'game_over' --> <GameOverScreen />
```

### Key Design Decisions

- **No external state library**: `useReducer` + `useContext` is sufficient for this scope. Redux or Zustand would be over-engineering.
- **Pure game logic**: `GameLogicService` contains only pure functions — trivial to unit-test without any React setup.
- **Static data import**: `products.json` is imported at build time (or fetched from `/public` at startup). No lazy loading needed given the dataset size.
- **Round advancement**: When a player answers correctly, the right product slides to the left position and a new random product is picked for the right. This is the classic Higher or Lower mechanic.
- **localStorage abstraction**: Wrapping localStorage in a service allows easy mocking in tests and graceful degradation in private browsing.

---

## Shared Data Schema

### GameProduct (contract between Unit 1 and Unit 2)

```typescript
interface GameProduct {
  sku: string;           // Krónan SKU
  name: string;          // Icelandic product name
  categorySlug: string;  // Category identifier
  categoryName: string;  // Icelandic category display name
  imageUrl: string;      // Product image URL
  priceIsk: number;      // Raw price in ISK (integer)
  pricePerUnit: number;  // Normalised price (integer ISK per unit)
  unitLabel: string;     // Display label e.g. "kr/kg", "kr/l", "kr/stk"
}
```

---

## Directory Structure (Preview)

```
/                              <- Workspace root
├── scripts/
│   └── fetch-data.ts          <- Unit 1: Pipeline entry point
├── src/
│   ├── data/
│   │   └── products.json      <- Generated by pipeline; consumed by app
│   ├── components/            <- React UI components
│   │   ├── App.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── CategoryPicker.tsx
│   │   ├── GameScreen.tsx
│   │   ├── HUD.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductImage.tsx
│   │   ├── AnswerButtons.tsx
│   │   └── GameOverScreen.tsx
│   ├── context/
│   │   └── GameStateProvider.tsx
│   ├── reducers/
│   │   └── gameReducer.ts
│   ├── services/
│   │   ├── gameLogicService.ts
│   │   ├── productPoolService.ts
│   │   └── localStorageService.ts
│   ├── types/
│   │   └── index.ts           <- All shared TypeScript types
│   └── main.tsx               <- React entry point
├── public/
│   └── placeholder.svg        <- Fallback product image
├── package.json
├── tsconfig.json
├── vite.config.ts             <- Vite recommended for React+TS
└── README.md
```
