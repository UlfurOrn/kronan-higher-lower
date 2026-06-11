# Unit Test Execution Instructions
# Krónan Higher or Lower Game

## Run All Unit Tests

```bash
npm test
```

Expected output:
```
 ✓ src/pipeline/__tests__/ProductFilter.test.ts (11)
 ✓ src/pipeline/__tests__/PricePerUnitCalculator.test.ts (18)
 ✓ src/services/__tests__/productPoolService.test.ts (14)
 ✓ src/services/__tests__/gameLogicService.test.ts (19)
 ✓ src/reducers/__tests__/gameReducer.test.ts (24)

 Test Files  5 passed (5)
      Tests  86 passed (86)
```

## Watch Mode (During Development)

```bash
npm run test:watch
```

Tests re-run automatically on file changes.

## Test Coverage by File

### Unit 1: Data Pipeline

| File | Tests | What is Covered |
|---|---|---|
| `PricePerUnitCalculator.test.ts` | 18 | kg, g, 100g, l, dl, cl, ml, stk, unknown unit, null price, zero price, negative price, rounding |
| `ProductFilter.test.ts` | 11 | NO_IMAGE, NO_PRICE, NO_PRICE_PER_UNIT, NO_CATEGORY, rule ordering, valid product |

### Unit 2: React Game App

| File | Tests | What is Covered |
|---|---|---|
| `gameLogicService.test.ts` | 19 | evaluateAnswer (higher/lower/equal), applyAnswer (correct/incorrect), lives deduction, streak logic, bestStreak, getMaxLives |
| `productPoolService.test.ts` | 14 | buildPool (all, by category, eligibility filters), pickInitialPair (distinct, min size), pickNextProduct (excludes left, always in pool), deriveCategories (min 2, alphabetical) |
| `gameReducer.test.ts` | 24 | All 6 action types: START_GAME (both modes), ANSWER (correct/incorrect/game-over), NEXT_ROUND, PLAY_AGAIN, CHANGE_SETTINGS, SET_BEST_STREAK |

## Key Invariants Verified by Tests

- `pricePerUnit` comparisons are mathematically correct including equal-price edge case
- Lives never go below 0
- Streak resets to 0 on wrong answer
- `bestStreak` never decreases
- Game transitions to `game_over` when last life is lost
- `PLAY_AGAIN` resets lives and streak but preserves mode, category, and bestStreak
- `CHANGE_SETTINGS` returns to setup without losing bestStreak

## Fixing Failing Tests

1. Read the failure output — Vitest shows expected vs received values
2. Check the relevant source file (not the test file) for the logic bug
3. Fix the source file
4. Tests auto-rerun in watch mode, or run `npm test` again
