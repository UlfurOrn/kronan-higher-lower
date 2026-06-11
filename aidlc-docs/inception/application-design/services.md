# Services
# Krónan Higher or Lower Game

---

## Overview

The system uses a lightweight service layer. Because there is no backend server at runtime, "services" here refer to:
1. **Pipeline services** — orchestration logic in the build-time data pipeline
2. **Frontend services** — pure utility/logic modules used by React components (not UI components themselves)

---

## Unit 1: Data Pipeline Services

### PipelineService (Orchestration)
- **Type**: Entry-point orchestrator
- **Responsibilities**:
  - Coordinate the full pipeline flow: fetch → filter → compute → write
  - Handle top-level errors and produce a non-zero exit code on failure
  - Emit a pipeline summary at completion
- **Depends on**: `KronanApiClient`, `ProductFilter`, `PricePerUnitCalculator`, `ProductDatasetWriter`
- **Invoked by**: `npm run fetch-data` (CLI entry point)

### KronanApiService
- **Type**: External API integration service
- **Responsibilities**:
  - Manage the Krónan API `AccessToken` (read from env, never logged)
  - Implement request throttling to stay within 200 req / 200 sec rate limit
  - Handle HTTP errors and retry transient failures (e.g. 429 Too Many Requests with backoff)
  - Paginate through all results transparently
- **Depends on**: `node-fetch` or built-in `fetch` (Node 18+)
- **Exposes**: `fetchAllProducts()`, `fetchCategories()`, `fetchProductsByCategory()`

---

## Unit 2: React Application Services

### ProductPoolService
- **Type**: Pure utility module (no side effects)
- **Responsibilities**:
  - Load and parse `products.json` at application startup
  - Filter the dataset to eligible products (defence-in-depth: image + pricePerUnit present)
  - Build the active product pool given a `GameMode` and optional category filter
  - Pick two distinct random products from the active pool for a new round
  - Pick one new random product (not matching current pair) when advancing a round
- **Depends on**: `products.json` (static import)
- **Used by**: `GameStateProvider`, `GameScreen`

### GameLogicService
- **Type**: Pure utility module (no side effects, fully testable)
- **Responsibilities**:
  - Evaluate whether a player's guess is correct given the two product price-per-unit values
  - Handle the edge case where both products have equal price-per-unit (treated as correct)
  - Compute updated `lives`, `streak`, and `bestStreak` values after an answer
  - Determine if the game is over (lives === 0)
  - Determine the initial `maxLives` from a `GameMode`
- **Depends on**: Nothing (pure functions only)
- **Used by**: `gameReducer`

### LocalStorageService
- **Type**: Browser storage utility
- **Responsibilities**:
  - Read best streak from `localStorage` (key: `kronan_best_streak`)
  - Write best streak to `localStorage`
  - Handle `localStorage` unavailability gracefully (e.g. private browsing) by falling back to in-memory value
- **Depends on**: Browser `localStorage` API
- **Used by**: `GameStateProvider` (on mount and on game over)

---

## Service Interaction Summary

```
CLI Entry Point
    └── PipelineService
            ├── KronanApiService  →  Krónan REST API
            ├── ProductFilter
            ├── PricePerUnitCalculator
            └── ProductDatasetWriter  →  products.json

React App (browser)
    └── App
            └── GameStateProvider (useReducer)
                    ├── gameReducer  ←  GameLogicService (pure)
                    ├── ProductPoolService  ←  products.json (static)
                    └── LocalStorageService  ←  localStorage
```
