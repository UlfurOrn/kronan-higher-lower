# Code Summary — Unit 2: React Game Application

## Created Files

| File | Description |
|---|---|
| `index.html` | HTML entry point (Vite, `lang="is"`) |
| `src/main.tsx` | React root mount |
| `src/index.css` | Global reset + CSS custom properties (dark theme) |
| `src/vite-env.d.ts` | Vite client types |
| `src/declarations.d.ts` | CSS module + SVG type declarations |
| `src/types/index.ts` | All shared TypeScript types |
| `src/services/gameLogicService.ts` | Pure game logic: evaluateAnswer, applyAnswer, getMaxLives |
| `src/services/productPoolService.ts` | buildPool, pickInitialPair, pickNextProduct, deriveCategories |
| `src/services/localStorageService.ts` | Read/write best streak from localStorage |
| `src/reducers/gameReducer.ts` | Pure reducer — all 6 action types |
| `src/context/GameStateProvider.tsx` | Context provider + useGameState hook + localStorage sync |
| `src/components/App.tsx` | Root component; view routing by game phase |
| `src/components/SetupScreen.tsx` | Pre-game config: mode + scope/category |
| `src/components/CategoryPicker.tsx` | Scrollable list of eligible categories |
| `src/components/GameScreen.tsx` | Active round: HUD + cards + answer buttons + reveal |
| `src/components/HUD.tsx` | Lives (hearts) + streak + category label |
| `src/components/ProductCard.tsx` | Product display: image, name, price/mystery |
| `src/components/ProductImage.tsx` | Image with placeholder fallback |
| `src/components/AnswerButtons.tsx` | Hærra / Lægra buttons |
| `src/components/GameOverScreen.tsx` | End screen: stats + losing round + replay |
| `public/placeholder.svg` | Fallback SVG for missing product images |

## Test Results
- 57 tests passing across 3 test files (gameLogicService: 19, productPoolService: 14, gameReducer: 24)

## How to Run

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm test         # Run all tests (86 total across both units)
```
