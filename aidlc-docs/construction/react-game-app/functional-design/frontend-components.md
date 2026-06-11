# Frontend Components — Unit 2: React Game Application

---

## Component Hierarchy

```
App
├── GameStateProvider (Context wrapper — no UI)
├── [phase === 'setup']     → SetupScreen
│   └── CategoryPicker      (conditional — when scope = 'category')
├── [phase === 'playing']   → GameScreen
│   ├── HUD
│   ├── ProductCard (left  — known,   revealed=true)
│   │   └── ProductImage
│   ├── ProductCard (right — mystery, revealed=false → true after answer)
│   │   └── ProductImage
│   └── AnswerButtons
└── [phase === 'game_over'] → GameOverScreen
    ├── ProductCard (left  — revealed=true)
    │   └── ProductImage
    └── ProductCard (right — revealed=true)
        └── ProductImage
```

---

## Component: App

### Props
None (root component)

### State
None (all state in GameStateProvider)

### Behaviour
- Renders `GameStateProvider` wrapping the entire tree
- Reads `phase` from game context
- Renders the matching top-level screen based on `phase`
- On mount: triggers localStorage read for `bestStreak` via context

### Render Logic
```
if phase === 'setup'     → <SetupScreen />
if phase === 'playing'   → <GameScreen />
if phase === 'game_over' → <GameOverScreen />
```

---

## Component: SetupScreen

### Props
None (reads/dispatches via context)

### Local State
```
scope: 'all' | 'category'   — default 'all'
selectedCategorySlug: string | null — default null
```

### Behaviour
- Displays game title: "Hærra eða Lægra?"
- Displays brief description: "Giskaðu á hvaða vara er dýrari á kílóverði!"
- Renders two mode buttons: "Venjulegur (3 líf)" and "Erfiður (1 líf)"
- Renders two scope toggles: "Allt" and "Eftir flokki"
- When "Eftir flokki" selected: renders `<CategoryPicker />`
- "Hefja leik" button:
  - Disabled when scope is 'category' and no category is selected
  - On click: builds active pool via `ProductPoolService.buildPool()`, picks initial pair, dispatches `START_GAME`

### User Interactions
| Interaction | Action |
|---|---|
| Click mode button | Update local mode selection |
| Click "Allt" | Set scope = 'all', clear selectedCategorySlug |
| Click "Eftir flokki" | Set scope = 'category' |
| Select category | Set selectedCategorySlug |
| Click "Hefja leik" | Dispatch START_GAME with selected settings |

---

## Component: CategoryPicker

### Props
```typescript
{
  products: GameProduct[];
  selected: string | null;
  onSelect: (slug: string) => void;
}
```

### Local State
None

### Behaviour
- Calls `ProductPoolService.deriveCategories(products)` to build list
- Renders a scrollable list / select dropdown of categories
- Each item shows `category.name` and `category.productCount` (e.g. "Mjólk og kefir (34)")
- Highlights currently selected category
- On click: calls `onSelect(slug)`

---

## Component: GameScreen

### Props
None (reads/dispatches via context)

### Local State
```
answered: boolean            — true after player submits answer, before next round
revealVariant: 'correct' | 'incorrect' | 'neutral'
animating: boolean           — true during reveal animation
```

### Behaviour
- Reads `currentLeft`, `currentRight`, `lives`, `maxLives`, `streak`, `selectedCategory`, `mode` from context
- Renders `<HUD />`, two `<ProductCard />` components, and `<AnswerButtons />`
- On answer submitted:
  1. Set `answered = true`, `animating = true`
  2. Evaluate correct/incorrect using `GameLogicService.evaluateAnswer()`
  3. Set `revealVariant` accordingly
  4. Dispatch `ANSWER` action
  5. Start reveal animation (CSS transition or setTimeout ~800ms)
  6. After animation:
     - If game over (from context phase change): no further action needed
     - If game continues: pick next product via `ProductPoolService.pickNextProduct()`, dispatch `NEXT_ROUND`, reset local state
- Answer buttons disabled while `answered === true`

### Reveal Animation Sequence
```
t=0ms   → Player clicks Hærra/Lægra
          answered=true, animating=true
          right card shows price (revealed=true)
          green/red colour applied to right card
t=800ms → If correct: right card slides left (CSS transform)
          new right card fades in
          answered=false, animating=false
          If wrong + game over: transition to game_over phase
          If wrong + lives remain: same slide + new card
```

---

## Component: ProductCard

### Props
```typescript
{
  product: GameProduct;
  revealed: boolean;           // false = show "?" for price
  variant: 'neutral' | 'correct' | 'incorrect';
  isKnown: boolean;            // true = left card (always revealed)
}
```

### Local State
None

### Behaviour
- Renders `<ProductImage src={product.imageUrl} alt={product.name} />`
- Renders product name (`product.name`)
- Renders category name (`product.categoryName`)
- Renders unit label (`product.unitLabel`)
- If `revealed === true`: renders price as `"{product.pricePerUnit} {product.unitLabel}"`
- If `revealed === false`: renders "?" in place of price
- Applies CSS class based on `variant`:
  - `neutral`: default styling
  - `correct`: green border/background accent
  - `incorrect`: red border/background accent

---

## Component: ProductImage

### Props
```typescript
{
  src: string;
  alt: string;
  className?: string;
}
```

### Local State
```
error: boolean — default false
```

### Behaviour
- Renders `<img src={src} alt={alt} />`
- On `onError`: sets `error = true`, replaces src with `/placeholder.svg`
- Fixed aspect ratio via CSS (1:1 square using `aspect-ratio: 1`)
- `object-fit: contain` to avoid cropping product images

---

## Component: HUD

### Props
```typescript
{
  lives: number;
  maxLives: number;
  streak: number;
  category: string | null;   // null = show nothing
}
```

### Local State
None

### Behaviour
- Renders a row of `maxLives` heart icons: filled (❤️) for remaining lives, empty (🤍) for lost
- Renders streak counter: "🔥 {streak}" (or plain "Röð: {streak}" in Icelandic)
- If `category !== null`: renders category label "Flokkur: {category}"
- Always visible at the top of `GameScreen`

---

## Component: AnswerButtons

### Props
```typescript
{
  onAnswer: (guess: 'higher' | 'lower') => void;
  disabled: boolean;
}
```

### Local State
None

### Behaviour
- Renders two large tap-friendly buttons:
  - "⬆ Hærra" (higher)
  - "⬇ Lægra" (lower)
- Both buttons disabled when `disabled === true`
- On click: calls `onAnswer('higher')` or `onAnswer('lower')`
- Buttons styled prominently — primary action in the game UI

---

## Component: GameOverScreen

### Props
None (reads/dispatches via context)

### Local State
None

### Behaviour
- Reads `streak`, `bestStreak`, `lastRound`, `mode`, `selectedCategory`, `activePool` from context
- Displays heading: "Leikur lokið!" (Game Over!)
- Displays final streak: "Röð þín: {streak}"
- Displays best streak: "Besta röð: {bestStreak}"
- Renders the losing round:
  - Left product card (revealed, neutral variant)
  - Right product card (revealed, incorrect variant)
  - Shows the correct price that the player got wrong
- Renders "Spila aftur" button:
  - Picks fresh initial pair, dispatches `PLAY_AGAIN`
- Renders "Breyta stillingum" button:
  - Dispatches `CHANGE_SETTINGS`

---

## User Interaction Flows

### Flow 1: Starting a Normal Mode Game (All Categories)
```
SetupScreen loads
→ Mode: Venjulegur selected (default)
→ Scope: Allt selected (default)
→ "Hefja leik" enabled
→ Player clicks "Hefja leik"
→ START_GAME dispatched
→ GameScreen renders with first product pair
```

### Flow 2: Starting a Hard Mode Game (Specific Category)
```
SetupScreen loads
→ Player clicks "Erfiður"
→ Player clicks "Eftir flokki"
→ CategoryPicker renders with eligible categories
→ Player selects a category
→ "Hefja leik" enabled
→ Player clicks "Hefja leik"
→ START_GAME dispatched with category filter
→ GameScreen renders — HUD shows category name
```

### Flow 3: Correct Answer Round Advancement
```
GameScreen: left=ProductA (price shown), right=ProductB (price hidden)
→ Player clicks "Hærra"
→ AnswerButtons disabled
→ ProductB price revealed (green)
→ 800ms animation: ProductB slides to left position
→ ProductC appears on right (price hidden)
→ HUD streak increments
→ AnswerButtons re-enabled
→ Game continues
```

### Flow 4: Wrong Answer — Game Over (Hard Mode)
```
GameScreen: left=ProductA (price shown), right=ProductB (price hidden)
→ Player clicks "Lægra" (wrong)
→ ProductB price revealed (red)
→ Phase transitions to 'game_over'
→ GameOverScreen renders with ProductA + ProductB shown
→ Streak = 0 shown, best streak preserved
→ Player clicks "Spila aftur"
→ PLAY_AGAIN dispatched
→ GameScreen renders fresh pair
```

---

## Icelandic UI String Reference

| Key | Icelandic | Context |
|---|---|---|
| game_title | Hærra eða Lægra? | App title / SetupScreen heading |
| game_description | Giskaðu á hvaða vara er dýrari á einingarverði! | SetupScreen subtitle |
| mode_normal | Venjulegur | Mode button |
| mode_hard | Erfiður | Mode button |
| lives_label | líf | Suffix for lives display |
| scope_all | Allt | Scope toggle |
| scope_category | Eftir flokki | Scope toggle |
| start_button | Hefja leik | Primary CTA |
| answer_higher | ⬆ Hærra | Answer button |
| answer_lower | ⬇ Lægra | Answer button |
| streak_label | Röð | HUD streak label |
| category_label | Flokkur | HUD category label |
| game_over_heading | Leikur lokið! | GameOverScreen heading |
| final_streak | Röð þín | GameOverScreen |
| best_streak | Besta röð | GameOverScreen |
| play_again | Spila aftur | GameOverScreen button |
| change_settings | Breyta stillingum | GameOverScreen button |
| known_label | (no label — price shown directly) | ProductCard left |
| mystery_label | ? | ProductCard right (unrevealed) |
