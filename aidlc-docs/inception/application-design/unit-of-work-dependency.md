# Unit of Work Dependencies
# Krónan Higher or Lower Game

---

## Dependency Matrix

| Unit | Depends On | Depended On By | Coupling Type |
|---|---|---|---|
| Unit 1: Data Pipeline | Krónan REST API (external), Node.js runtime | Unit 2 (via products.json) | Loose — file artifact |
| Unit 2: React Game App | Unit 1 output (products.json), Browser APIs | — (end product) | Loose — file contract |

---

## Dependency Diagram

```
[Krónan REST API]
        |
        v
[Unit 1: Data Pipeline]
        |
        | produces
        v
  products.json          <-- contract boundary
        |
        | consumes
        v
[Unit 2: React Game App]
        |
        v
  [Browser / User]
```

---

## Contract: products.json Schema

This file is the sole coupling point between Unit 1 and Unit 2. Both units must agree on this schema.

```typescript
// Array of GameProduct objects
GameProduct[]

interface GameProduct {
  sku: string;           // Krónan SKU — unique identifier
  name: string;          // Icelandic product name
  categorySlug: string;  // Machine-readable category identifier
  categoryName: string;  // Icelandic display name for the category
  imageUrl: string;      // Absolute URL to product image
  priceIsk: number;      // Raw price in ISK (integer, no decimals)
  pricePerUnit: number;  // Normalised price in ISK per unit (integer)
  unitLabel: string;     // Display label: "kr/kg", "kr/l", "kr/stk", etc.
}
```

**Schema stability rule**: Any change to `GameProduct` must be coordinated — Unit 1 must be updated and re-run before Unit 2 can use the new fields.

---

## Build Order

| Step | Unit | Action | Prerequisite |
|---|---|---|---|
| 1 | Unit 1 | Implement and test data pipeline | None |
| 2 | Unit 1 | Run pipeline: `npm run fetch-data` | Valid `KRONAN_API_TOKEN` env var |
| 3 | Unit 2 | Implement and test React game app | `products.json` present (sample or real) |
| 4 | Both | Integration: verify game loads correctly with real pipeline output | Steps 1–3 complete |

---

## External Dependencies

| Dependency | Unit | Type | Notes |
|---|---|---|---|
| Krónan REST API (`api.kronan.is`) | Unit 1 | External HTTP API | Requires `KRONAN_API_TOKEN`; rate-limited to 200 req/200 sec |
| Node.js LTS | Unit 1 | Runtime | Required to run the pipeline script |
| Browser (modern) | Unit 2 | Runtime | Needs `localStorage` support and ES2020+ |
| Vite | Unit 2 | Build tool | Dev server + production bundler |

---

## Risk: External API Dependency

The Krónan API is an external dependency for Unit 1 only. Risks:

| Risk | Mitigation |
|---|---|
| API unavailable during pipeline run | Re-run pipeline later; app continues to work with existing products.json |
| API schema changes (field names/types) | Pin the mapping in `KronanApiClient`; update when notified |
| Rate limit hit during full catalog fetch | Implement throttling with sleep/backoff in `KronanApiClient` |
| Product data changes (prices, availability) | Re-run pipeline periodically (weekly recommended) to refresh data |
