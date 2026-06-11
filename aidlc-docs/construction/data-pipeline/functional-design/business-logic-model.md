# Business Logic Model — Unit 1: Data Pipeline

---

## Pipeline Flow

```
START
  |
  v
[1] Validate Environment
    - Read KRONAN_API_TOKEN from env
    - If missing/empty: print error, exit(1)
  |
  v
[2] Fetch All Categories
    - GET /api/v1/categories/
    - Returns: KronanCategory[]
  |
  v
[3] For each category (sequential, throttled):
    - GET /api/v1/categories/{slug}/products/ (paginated)
    - Accumulate: KronanRawProduct[]
  |
  v
[4] Deduplicate products by SKU
    - Multiple categories may reference the same product
    - Keep first occurrence
  |
  v
[5] For each raw product:
    a. PricePerUnitCalculator.compute(product)
       -> PricePerUnitResult | null
    b. ProductFilter.isEligible(product, result)
       -> boolean + RejectionReason if false
  |
  v
[6] Separate into:
    - eligible: GameProduct[]
    - excluded: { product, reason }[]
  |
  v
[7] Map eligible products to GameProduct schema
  |
  v
[8] ProductDatasetWriter.write(gameProducts, outputPath)
    - Serialise to JSON
    - Write to src/data/products.json
  |
  v
[9] ProductDatasetWriter.printSummary(summary)
    - Print totals and exclusion breakdown to stdout
  |
  v
EXIT(0)
```

---

## Algorithm: PricePerUnitCalculator.compute

```
Input:  KronanRawProduct
Output: PricePerUnitResult | null

1. Normalise unit string: trim, lowercase
2. Determine UnitType by matching unit string against known patterns:
   - kg patterns:  ["kg", "g", "100g", "gram"]
   - litre patterns: ["l", "litre", "liter", "ml", "cl", "dl"]
   - piece patterns: ["stk", "stykki", "pk", "pcs", "each", "", null]
   - else: UnitType = unknown -> return null

3. Based on UnitType:

   CASE kg:
     - if unit == "kg":
         value = price
         label = "kr/kg"
     - if unit == "g":
         if unitSize is null or 0: return null
         value = round(price / unitSize * 1000)
         label = "kr/kg"
     - if unit == "100g":
         if unitSize is null or 0: return null
         value = round(price * 10)     // price is already per 100g
         label = "kr/kg"

   CASE litre:
     - if unit == "l":
         value = price
         label = "kr/l"
     - if unit == "dl":
         value = round(price * 10)
         label = "kr/l"
     - if unit == "cl":
         value = round(price * 100)
         label = "kr/l"
     - if unit == "ml":
         if unitSize is null or 0: return null
         value = round(price / unitSize * 1000)
         label = "kr/l"

   CASE piece:
     value = price
     label = "kr/stk"

4. Guard: if value <= 0 after rounding -> return null
5. Return { value, unitLabel: label }
```

---

## Algorithm: ProductFilter.isEligible

```
Input:  KronanRawProduct, PricePerUnitResult | null
Output: boolean, RejectionReason | null

Rules applied in order (short-circuit on first failure):

1. images is non-empty AND images[0].url is non-empty string
   -> fail: NO_IMAGE

2. price is number AND price > 0
   -> fail: NO_PRICE

3. pricePerUnit is not null
   -> fail: NO_PRICE_PER_UNIT

4. category is not null AND category.slug is non-empty string
   -> fail: NO_CATEGORY

5. All passed -> return eligible: true
```

---

## Algorithm: Deduplication

```
Input:  KronanRawProduct[] (may contain duplicates across categories)
Output: KronanRawProduct[] (unique by SKU)

1. Iterate products in order
2. Track seen SKUs in a Set<string>
3. If sku already in set: discard
4. If sku not in set: add to set, keep product
5. Return deduplicated array

Note: The product's category association from its first occurrence is preserved.
This means the category used for a product in the game is the first category the
API associates it with.
```

---

## Algorithm: Rate-Limited HTTP Client

```
State:
  - requestTimestamps: number[]   // timestamps of last N requests
  - MIN_INTERVAL_MS = 350         // min ms between requests (conservative)

Before each request:
  1. Check time since last request
  2. If < MIN_INTERVAL_MS: sleep(MIN_INTERVAL_MS - elapsed)
  3. Record current timestamp
  4. Make HTTP request

On 429 response:
  1. Read Retry-After header (default: 10000ms)
  2. Sleep for retry-after duration
  3. Retry request
  4. Max 3 retries; on 4th failure: throw error
```

---

## Algorithm: Pagination

```
Input:  endpoint URL, query params
Output: T[] (all items across all pages)

State:
  - offset = 0
  - pageSize = 100   // use large page size to minimise requests
  - allItems = []

Loop:
  1. Fetch page: GET endpoint?limit=pageSize&offset=offset
  2. Append results to allItems
  3. If results.length < pageSize: break (last page reached)
  4. offset += pageSize
  5. Repeat

Return allItems
```

---

## Data Mapping: KronanRawProduct → GameProduct

```
GameProduct {
  sku:          rawProduct.sku
  name:         rawProduct.name
  categorySlug: rawProduct.category.slug
  categoryName: rawProduct.category.name
  imageUrl:     rawProduct.images[0].url
  priceIsk:     rawProduct.price
  pricePerUnit: pricePerUnitResult.value
  unitLabel:    pricePerUnitResult.unitLabel
}
```

---

## Error Handling Model

| Scenario | Action |
|---|---|
| KRONAN_API_TOKEN missing | Print error to stderr, exit(1) immediately |
| HTTP 401 Unauthorized | Print "Invalid API token", exit(1) |
| HTTP 429 Too Many Requests | Wait + retry (up to 3x), then exit(1) |
| HTTP 5xx Server Error | Retry once after 5s; if fails again, exit(1) with message |
| Network timeout | Retry once; if fails again, exit(1) |
| JSON parse error from API | Log the raw response, exit(1) |
| File write failure | Print error to stderr, exit(1) |
| Empty dataset after filtering | Print warning to stderr, write empty array, exit(0) |
| Fewer than 10 products | Print warning to stderr, continue normally, exit(0) |
