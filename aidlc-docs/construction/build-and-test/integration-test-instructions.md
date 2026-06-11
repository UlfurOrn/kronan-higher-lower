# Integration Test Instructions
# Krónan Higher or Lower Game

## Overview

Integration testing verifies that the two units work together correctly via their shared contract (`products.json`).

---

## Scenario 1: Pipeline → Game App Data Contract

**What is tested**: Products produced by the pipeline are correctly consumed by the React app.

**Setup**:
1. Set `KRONAN_API_TOKEN` to a valid token (or use the sample dataset)
2. Run the pipeline: `npm run fetch-data`

**Test Steps**:
1. Verify `src/data/products.json` was created
2. Verify the file is valid JSON: `node -e "JSON.parse(require('fs').readFileSync('src/data/products.json'))"`
3. Verify all records match the `GameProduct` schema:
   - `sku` is a non-empty string
   - `name` is a non-empty string
   - `categorySlug` is a non-empty string
   - `categoryName` is a non-empty string
   - `imageUrl` is a non-empty string (URL)
   - `priceIsk` is a positive integer
   - `pricePerUnit` is a positive integer
   - `unitLabel` is one of `"kr/kg"`, `"kr/l"`, `"kr/stk"`
4. Start the app: `npm run dev`
5. Open the browser — the SetupScreen should load without errors
6. Verify the category picker shows categories from the generated dataset
7. Start a game and verify product names, images, and prices display

**Expected Results**:
- Pipeline completes with exit code 0
- `products.json` contains valid records
- App loads and plays correctly with the generated data

---

## Scenario 2: Game Loop End-to-End (Manual Browser Test)

**What is tested**: The full game flow from setup to game over.

**Setup**: `npm run dev`, open `http://localhost:5173`

**Test Steps — Normal Mode, All Categories**:
1. On SetupScreen: select "Venjulegur" mode, "Allt" scope
2. Click "Hefja leik" — verify GameScreen loads with 2 product cards and ❤️❤️❤️ in HUD
3. Note the left product's price-per-unit (shown)
4. Note the right product's unit label (price hidden behind "?")
5. Click "Hærra" or "Lægra"
6. Verify: right card reveals price, green (correct) or red (incorrect) styling applied
7. Verify: after ~900ms, right card slides left, new mystery card appears
8. If correct: verify streak counter increments in HUD
9. If incorrect: verify one heart goes empty (🤍)
10. Continue until all lives gone — verify GameOverScreen appears
11. Verify: final streak shown, best streak shown, losing round cards shown
12. Click "Spila aftur" — verify new game starts with same settings

**Test Steps — Hard Mode, Single Category**:
1. On SetupScreen: select "Erfiður", "Eftir flokki"
2. Select any category from the list
3. Click "Hefja leik" — verify HUD shows category name and single ❤️
4. Answer incorrectly — verify immediate game over
5. Click "Breyta stillingum" — verify SetupScreen returns

**Test Steps — localStorage persistence**:
1. Play a game and achieve a streak > 0
2. Refresh the page
3. On GameOverScreen: verify best streak still shows after refresh

---

## Scenario 3: Pipeline Filtering Validation

**What is tested**: The pipeline correctly excludes ineligible products.

**Setup**: A real `KRONAN_API_TOKEN`

**Test Steps**:
1. Run `KRONAN_API_TOKEN=xxx npm run fetch-data`
2. Read the stdout summary
3. Verify `Total included` > 0
4. Verify `Total excluded` >= 0 with counts per reason
5. Spot-check 3–5 products in `products.json`:
   - Open each `imageUrl` in a browser — image should load
   - Verify `pricePerUnit` is reasonable for the `unitLabel`

**Expected Results**:
- No products with empty `imageUrl` in `products.json`
- No products with `pricePerUnit <= 0`
- All `unitLabel` values are valid
