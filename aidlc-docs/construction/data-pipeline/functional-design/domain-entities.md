# Domain Entities — Unit 1: Data Pipeline

---

## Entity: KronanRawProduct

Raw product record as returned by the Krónan API. This is the input to the pipeline.

| Field | Type | Source | Notes |
|---|---|---|---|
| sku | string | API | Unique product identifier |
| name | string | API | Icelandic product name |
| category | { slug: string; name: string } \| null | API | May be null for uncategorised products |
| images | { url: string }[] | API | Array; may be empty |
| price | number \| null | API | Price in ISK (integer); null if unavailable |
| unit | string \| null | API | Unit string e.g. "kg", "l", "stk", "100g" |
| unitSize | number \| null | API | Quantity per unit e.g. 1, 0.5, 100 |

---

## Entity: PricePerUnitResult

The result of normalising a raw product's price to a per-unit basis.

| Field | Type | Description |
|---|---|---|
| value | number | Price in ISK per standard unit (integer) |
| unitLabel | string | Display label e.g. "kr/kg", "kr/l", "kr/stk" |

---

## Entity: GameProduct

The canonical product record written to `products.json`. This is the output contract between Unit 1 and Unit 2.

| Field | Type | Derived From | Notes |
|---|---|---|---|
| sku | string | KronanRawProduct.sku | Primary key |
| name | string | KronanRawProduct.name | Icelandic name, as-is from API |
| categorySlug | string | KronanRawProduct.category.slug | Used for category filtering in game |
| categoryName | string | KronanRawProduct.category.name | Icelandic display name |
| imageUrl | string | KronanRawProduct.images[0].url | First image; guaranteed non-empty after filtering |
| priceIsk | number | KronanRawProduct.price | Raw ISK price (integer) |
| pricePerUnit | number | PricePerUnitResult.value | Normalised price per unit (integer ISK) |
| unitLabel | string | PricePerUnitResult.unitLabel | e.g. "kr/kg", "kr/l", "kr/stk" |

---

## Entity: UnitType

An enumeration of supported unit types for price-per-unit normalisation.

| Value | Meaning | Normalisation Target |
|---|---|---|
| `kg` | Kilograms | Price per 1 kg |
| `litre` | Litres | Price per 1 litre |
| `piece` | Individual item / piece | Price per 1 piece |
| `unknown` | Cannot be determined | → product excluded |

---

## Entity: RejectionReason

Tracks why a product was excluded from the dataset. Used in the pipeline summary.

| Value | Meaning |
|---|---|
| `NO_IMAGE` | Product has no image URLs |
| `NO_PRICE` | Price is null or zero |
| `NO_PRICE_PER_UNIT` | Price-per-unit cannot be computed (unknown unit type or null unitSize) |
| `NO_CATEGORY` | Product has no category (excluded to ensure category filtering works) |

---

## Entity: PipelineSummary

Reported to stdout at the end of a pipeline run.

| Field | Type | Description |
|---|---|---|
| totalFetched | number | Total raw products fetched from the API |
| totalIncluded | number | Products that passed all filters |
| totalExcluded | number | Products that failed at least one filter |
| exclusionReasons | Record\<RejectionReason, number\> | Count per rejection reason |

---

## Entity: KronanCategory

A product category from the Krónan API.

| Field | Type | Description |
|---|---|---|
| slug | string | Machine-readable identifier (used in API calls) |
| name | string | Icelandic display name |
