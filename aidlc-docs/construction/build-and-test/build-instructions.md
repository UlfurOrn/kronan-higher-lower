# Build Instructions
# Krónan Higher or Lower Game

## Prerequisites

- **Node.js**: LTS v20 or later
- **npm**: v9 or later (bundled with Node.js)
- **Krónan API Token**: Only required for `npm run fetch-data` (not for running the game)

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

Expected output: `added X packages` with no errors.

### 2. (Optional) Refresh Product Data

Run the data pipeline to fetch real prices from the Krónan API:

```bash
KRONAN_API_TOKEN=your_token_here npm run fetch-data
```

Skip this step to use the bundled sample data (`src/data/products.json`).

### 3. Development Build

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot-module replacement is active.

### 4. Production Build

```bash
npm run build
```

Expected output:
```
vite v5.x building for production...
✓ X modules transformed.
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
✓ built in Xms
```

Build artifacts are written to `dist/`.

### 5. Preview Production Build

```bash
npm run preview
```

Serves the `dist/` folder locally at `http://localhost:4173`.

## Build Artifacts

| Artifact | Location | Description |
|---|---|---|
| `dist/index.html` | `dist/` | HTML entry point |
| `dist/assets/index-*.js` | `dist/assets/` | Bundled JavaScript (~50KB gzip) |
| `dist/assets/index-*.css` | `dist/assets/` | Bundled CSS |
| `src/data/products.json` | `src/data/` | Product dataset (pipeline output) |

## Troubleshooting

### `Cannot find module` errors
- Run `npm install` again — node_modules may be incomplete

### `KRONAN_API_TOKEN not set` error
- Only affects `npm run fetch-data`, not `npm run dev` or `npm run build`
- Set the env var or use the bundled sample data

### Port 5173 already in use
- Vite will automatically try the next available port (5174, 5175, etc.)
- Or run `npx kill-port 5173` to free the port
