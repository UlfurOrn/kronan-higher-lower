# Business Rules — Unit 1: Data Pipeline

---

## BR-01: Product Eligibility Rules

A product is eligible for inclusion in `products.json` if and only if ALL of the following conditions are true:

| Rule | Condition | Rejection Reason |
|---|---|---|
| BR-01-A | `images` array is non-empty AND `images[0].url` is a non-empty string | `NO_IMAGE` |
| BR-01-B | `price` is a number AND `price > 0` | `NO_PRICE` |
| BR-01-C | Price-per-unit can be computed (see BR-02) | `NO_PRICE_PER_UNIT` |
| BR-01-D | `category` is non-null AND `category.slug` is a non-empty string | `NO_CATEGORY` |

All four rules must pass. Failure of any single rule excludes the product.

---

## BR-02: Price-Per-Unit Computation Rules

The pipeline normalises each product's price to a per-unit basis using the following rules, applied in order:

### BR-02-A: Kilogram-based products
- **Condition**: `unit` contains "kg" (case-insensitive) OR `unit` is "g" or "100g"
- **Computation**:
  - If unit is "kg": `pricePerUnit = price` (already per kg), `unitLabel = "kr/kg"`
  - If unit is "g": `pricePerUnit = round(price / unitSize * 1000)`, `unitLabel = "kr/kg"`
  - If unit is "100g": `pricePerUnit = round(price / unitSize * 10)`, `unitLabel = "kr/kg"`
- **Result type**: `kg`

### BR-02-B: Litre-based products
- **Condition**: `unit` contains "l" or "litre" or "ml" (case-insensitive)
- **Computation**:
  - If unit is "l": `pricePerUnit = price`, `unitLabel = "kr/l"`
  - If unit is "ml": `pricePerUnit = round(price / unitSize * 1000)`, `unitLabel = "kr/l"`
  - If unit is "cl": `pricePerUnit = round(price / unitSize * 100)`, `unitLabel = "kr/l"`
- **Result type**: `litre`

### BR-02-C: Piece/unit products
- **Condition**: `unit` is "stk", "stykki", "pk", "pcs", "each", or null/empty AND `unitSize` is 1 or null
- **Computation**: `pricePerUnit = price`, `unitLabel = "kr/stk"`
- **Result type**: `piece`

### BR-02-D: Unknown unit type
- **Condition**: None of the above rules match
- **Result**: `null` — product is excluded (BR-01-C fails)

### BR-02-E: Rounding rule
- All computed `pricePerUnit` values are rounded to the nearest integer (ISK has no decimals)
- `Math.round()` is used for rounding

### BR-02-F: Zero or negative result guard
- If the computed `pricePerUnit` is ≤ 0 after rounding, the result is treated as `null` (product excluded)

---

## BR-03: Pagination Rules

### BR-03-A: Fetch all pages
- The pipeline must fetch ALL pages of results for each category/search endpoint
- Pagination continues until the API returns fewer results than the requested page size (indicating last page)

### BR-03-B: Page size
- Use the maximum supported page size per request to minimise the number of API calls

### BR-03-C: Empty category handling
- If a category returns 0 products, it is silently skipped (not an error)

---

## BR-04: Rate Limiting Rules

### BR-04-A: Request budget
- Krónan API allows 200 requests per 200 seconds per user
- The pipeline must not exceed this rate

### BR-04-B: Throttling strategy
- The pipeline enforces a minimum delay between requests: `200_000ms / 200 = 1000ms per request` (conservative)
- In practice, a delay of 300–500ms between requests is sufficient and well within limits

### BR-04-C: 429 handling
- If the API returns HTTP 429 (Too Many Requests), the pipeline must:
  1. Wait for the retry-after period (use `Retry-After` header if present, otherwise 10 seconds)
  2. Retry the same request
  3. Retry up to 3 times before failing with an error

---

## BR-05: Authentication Rules

### BR-05-A: Token source
- The `KRONAN_API_TOKEN` must be read exclusively from the environment variable
- The token must never be logged, printed, or written to any file

### BR-05-B: Missing token
- If `KRONAN_API_TOKEN` is not set or is an empty string, the pipeline must:
  1. Print a clear error message: "KRONAN_API_TOKEN environment variable is not set"
  2. Exit with a non-zero exit code immediately (before making any API calls)

### BR-05-C: Auth header format
- All API requests must include the header: `Authorization: AccessToken <token>`

---

## BR-06: Output Rules

### BR-06-A: Output path
- `products.json` is written to `src/data/products.json` relative to the project root

### BR-06-B: Overwrite behaviour
- Each pipeline run overwrites the existing `products.json` completely (no merging)

### BR-06-C: Minimum dataset size
- If the filtered dataset contains fewer than 10 products, the pipeline prints a warning to stderr but still writes the file

### BR-06-D: Summary output
- The pipeline summary is written to stdout after a successful run
- Format:
  ```
  Pipeline complete.
  Total fetched:   1234
  Total included:  987
  Total excluded:  247
    - NO_IMAGE:           120
    - NO_PRICE:            45
    - NO_PRICE_PER_UNIT:   72
    - NO_CATEGORY:         10
  ```

### BR-06-E: Error exit codes
- Exit code 0: success
- Exit code 1: any unrecoverable error (missing token, API failure after retries, write failure)
