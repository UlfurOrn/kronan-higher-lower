# Component Dependencies
# Krónan Higher or Lower Game

---

## Unit 1: Data Pipeline — Dependency Graph

```
PipelineOrchestrator (entry point)
    ├── KronanApiClient          (fetches raw product data)
    ├── PricePerUnitCalculator   (computes price-per-unit per product)
    ├── ProductFilter            (uses PricePerUnitCalculator result to decide eligibility)
    └── ProductDatasetWriter     (writes final GameProduct[] to products.json)
```

### Dependency Matrix — Unit 1

| Component | Depends On | Depended On By |
|---|---|---|
| PipelineOrchestrator | KronanApiClient, ProductFilter, PricePerUnitCalculator, ProductDatasetWriter | — (entry point) |
| KronanApiClient | node fetch / http | PipelineOrchestrator |
| PricePerUnitCalculator | — (pure) | PipelineOrchestrator, ProductFilter |
| ProductFilter | PricePerUnitCalculator (result passed in) | PipelineOrchestrator |
| ProductDatasetWriter | fs (Node.js) | PipelineOrchestrator |

### Data Flow — Unit 1

```
KronanApiClient
    → KronanRawProduct[]
        → PricePerUnitCalculator (per product)
            → PricePerUnitResult | null
        → ProductFilter (product + PricePerUnitResult)
            → GameProduct[] (eligible only)
        → ProductDatasetWriter
            → products.json
```

---

## Unit 2: React Game Application — Dependency Graph

```
App
├── GameStateProvider (Context + Reducer)
│   ├── gameReducer
│   │   └── GameLogicService (pure — evaluate guess, update lives/streak)
│   ├── ProductPoolService (load + filter products.json, pick random pairs)
│   └── LocalStorageService (read/write bestStreak)
│
├── SetupScreen
│   ├── CategoryPicker → ProductPoolService (derive eligible categories)
│   └── dispatches: START_GAME → GameStateProvider
│
├── GameScreen
│   ├── HUD (reads lives, streak, category from context)
│   ├── ProductCard × 2 (left = known, right = mystery)
│   │   └── ProductImage (with fallback)
│   ├── AnswerButtons
│   │   └── dispatches: ANSWER → GameStateProvider
│   └── ProductPoolService (pick next product on advance)
│
└── GameOverScreen
    ├── ProductCard × 2 (both revealed, showing losing round)
    └── dispatches: PLAY_AGAIN | CHANGE_SETTINGS → GameStateProvider
```

### Dependency Matrix — Unit 2

| Component | Depends On | Depended On By |
|---|---|---|
| App | GameStateProvider, SetupScreen, GameScreen, GameOverScreen | — (root) |
| GameStateProvider | gameReducer, ProductPoolService, LocalStorageService | App, all screens |
| gameReducer | GameLogicService | GameStateProvider |
| GameLogicService | — (pure) | gameReducer |
| ProductPoolService | products.json (static) | GameStateProvider, SetupScreen, GameScreen |
| LocalStorageService | browser localStorage | GameStateProvider |
| SetupScreen | GameStateProvider (dispatch), CategoryPicker | App |
| CategoryPicker | ProductPoolService | SetupScreen |
| GameScreen | GameStateProvider (state+dispatch), HUD, ProductCard, AnswerButtons, ProductPoolService | App |
| HUD | GameStateProvider (state) | GameScreen |
| ProductCard | ProductImage | GameScreen, GameOverScreen |
| ProductImage | — | ProductCard |
| AnswerButtons | — | GameScreen |
| GameOverScreen | GameStateProvider (state+dispatch), ProductCard | App |

### Communication Patterns

| Pattern | Used Between |
|---|---|
| React Context (read) | All screens/components → GameStateProvider state |
| React Context (dispatch) | SetupScreen, GameScreen, GameOverScreen → GameStateProvider |
| Props (data + callbacks) | GameScreen → ProductCard, HUD, AnswerButtons |
| Props (callbacks) | SetupScreen → CategoryPicker |
| Direct import (pure utils) | gameReducer → GameLogicService |
| Direct import (async/side-effect) | GameStateProvider → LocalStorageService |
| Static JSON import | ProductPoolService → products.json |

---

## Inter-Unit Dependency

| Dependency | Direction | Type |
|---|---|---|
| `products.json` | Unit 1 → Unit 2 | File artifact (pipeline output = app input) |

Unit 1 (pipeline) must be run before Unit 2 (React app) can serve real product data. During development, a sample `products.json` can be committed to unblock frontend work.

---

## Coupling Assessment

| Coupling Type | Status | Notes |
|---|---|---|
| Unit 1 ↔ Unit 2 | Loose (file contract) | Only coupled via `GameProduct` schema in `products.json` |
| GameStateProvider ↔ screens | Moderate (context) | All screens read from shared context — intentional for a small app |
| GameLogicService ↔ reducer | Loose (pure functions) | No shared state; easily unit-testable |
| ProductPoolService ↔ components | Loose (imported module) | Stateless; injectable in tests |
| LocalStorageService ↔ provider | Loose (abstracted) | Abstraction allows easy testing with mock storage |
