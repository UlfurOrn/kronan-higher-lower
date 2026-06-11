# Unit of Work — Story Map
# Krónan Higher or Lower Game

## Requirement-to-Unit Mapping

Each functional requirement maps to one or both units.

| Requirement | Description | Unit 1: Data Pipeline | Unit 2: React Game App |
|---|---|---|---|
| FR-01 | Data Pipeline (Build-Time) | PRIMARY | — |
| FR-02 | Product Selection Per Round | Supporting (filter logic) | PRIMARY |
| FR-03 | Core Game Mechanic — Price Per Unit | Supporting (computes pricePerUnit) | PRIMARY |
| FR-04 | Lives System and Game Modes | — | PRIMARY |
| FR-05 | Streak Tracking | — | PRIMARY |
| FR-06 | Game Over Screen | — | PRIMARY |
| FR-07 | Category Selection UI | Supporting (categorySlug/Name in data) | PRIMARY |
| FR-08 | Language — Icelandic | Supporting (Icelandic names in data) | PRIMARY |
| FR-09 | Product Image Display | Supporting (imageUrl in data) | PRIMARY |
| FR-10 | Start Screen / Home | — | PRIMARY |
| NFR-01 | Local Development | Supporting (npm run fetch-data) | PRIMARY (npm run dev) |
| NFR-02 | Functional Correctness | Supporting (correct pricePerUnit) | PRIMARY (game logic) |
| NFR-03 | Data Freshness | PRIMARY (re-runnable script) | — |

---

## User Journey → Unit Mapping

```
Player Journey                        Unit Responsible
----------------------------------------------------
Open the app                     -->  Unit 2: App loads products.json
See start screen                 -->  Unit 2: SetupScreen renders
Choose mode (Normal/Hard)        -->  Unit 2: GameStateProvider
Choose category or "All"         -->  Unit 2: CategoryPicker + ProductPoolService
Press "Hefja leik"               -->  Unit 2: START_GAME action dispatched
See two product cards            -->  Unit 2: GameScreen + ProductCard
Guess Hærra or Lægra             -->  Unit 2: AnswerButtons + gameReducer
See reveal animation             -->  Unit 2: GameScreen animation
Correct: next round              -->  Unit 2: NEXT_ROUND + ProductPoolService
Wrong: lose a life               -->  Unit 2: GameLogicService + HUD update
All lives gone: Game Over        -->  Unit 2: GameOverScreen
See final streak + best streak   -->  Unit 2: LocalStorageService
Press "Spila aftur"              -->  Unit 2: PLAY_AGAIN action
Press "Breyta stillingum"        -->  Unit 2: CHANGE_SETTINGS action

----- Build-time (developer) -----
Run npm run fetch-data           -->  Unit 1: PipelineOrchestrator
Fetch products from Krónan       -->  Unit 1: KronanApiClient
Compute price-per-unit           -->  Unit 1: PricePerUnitCalculator
Filter eligible products         -->  Unit 1: ProductFilter
Write products.json              -->  Unit 1: ProductDatasetWriter
```

---

## Unit 1: Data Pipeline — Work Breakdown

| Task | Component | Priority |
|---|---|---|
| Set up TypeScript pipeline project structure | — | High |
| Implement KronanApiClient (auth, GET, pagination) | KronanApiClient | High |
| Implement rate-limit throttling | KronanApiClient | High |
| Implement PricePerUnitCalculator | PricePerUnitCalculator | High |
| Implement ProductFilter | ProductFilter | High |
| Implement ProductDatasetWriter | ProductDatasetWriter | High |
| Implement PipelineOrchestrator (entry point) | PipelineOrchestrator | High |
| Write unit tests for PricePerUnitCalculator | — | High |
| Write unit tests for ProductFilter | — | High |
| Run pipeline and validate products.json output | — | High |

---

## Unit 2: React Game App — Work Breakdown

| Task | Component | Priority |
|---|---|---|
| Set up Vite + React + TypeScript project | — | High |
| Define all TypeScript types (index.ts) | — | High |
| Implement GameLogicService (pure functions) | GameLogicService | High |
| Implement gameReducer | gameReducer | High |
| Implement ProductPoolService | ProductPoolService | High |
| Implement LocalStorageService | LocalStorageService | High |
| Implement GameStateProvider (context + reducer) | GameStateProvider | High |
| Implement App (root, view routing) | App | High |
| Implement SetupScreen | SetupScreen | High |
| Implement CategoryPicker | CategoryPicker | High |
| Implement HUD | HUD | High |
| Implement ProductImage (with fallback) | ProductImage | High |
| Implement ProductCard | ProductCard | High |
| Implement AnswerButtons | AnswerButtons | High |
| Implement GameScreen (round logic + animation) | GameScreen | High |
| Implement GameOverScreen | GameOverScreen | High |
| Write unit tests for gameReducer | — | High |
| Write unit tests for GameLogicService | — | High |
| Create sample products.json (5–10 records) for dev | — | High |
| Wire up all components and test full game loop | — | High |
| Write README with setup instructions | — | High |
