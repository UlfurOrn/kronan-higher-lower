# Code Summary — Unit 1: Data Pipeline

## Created Files

| File | Description |
|---|---|
| `scripts/fetch-data.ts` | CLI entry point — invokes PipelineOrchestrator |
| `src/types/index.ts` | All shared TypeScript types (pipeline + game app) |
| `src/pipeline/KronanApiClient.ts` | HTTP client: auth, pagination, throttling, 429 retry |
| `src/pipeline/PricePerUnitCalculator.ts` | Normalises raw product price to price-per-unit |
| `src/pipeline/ProductFilter.ts` | Applies 4 eligibility rules; returns reason on rejection |
| `src/pipeline/ProductDatasetWriter.ts` | Writes products.json; prints pipeline summary to stdout |
| `src/pipeline/PipelineOrchestrator.ts` | Orchestrates full pipeline flow; validates env; handles errors |
| `src/data/products.json` | Sample dataset (12 products, mixed categories/units) |
| `src/pipeline/__tests__/PricePerUnitCalculator.test.ts` | 18 unit tests |
| `src/pipeline/__tests__/ProductFilter.test.ts` | 11 unit tests |

## How to Run

```bash
KRONAN_API_TOKEN=your_token_here npm run fetch-data
```

## Test Results
- 29 tests passing across 2 test files
