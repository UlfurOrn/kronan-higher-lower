import type { KronanRawProduct, PricePerUnitResult, RejectionReason } from '../types/index.js'

export interface FilterResult {
  eligible: boolean
  reason: RejectionReason | null
}

/**
 * Applies eligibility rules to a raw Krónan product.
 * Uses the actual API field names: `image` (full-size) and `thumbnail`.
 */
export class ProductFilter {
  check(
    product: KronanRawProduct,
    pricePerUnit: PricePerUnitResult | null
  ): FilterResult {
    // Rule 1: must have at least one usable image URL
    const imageUrl = product.image?.trim() || product.thumbnail?.trim()
    if (!imageUrl) {
      return { eligible: false, reason: 'NO_IMAGE' }
    }

    // Rule 2: must have a positive price
    if (product.price === null || product.price <= 0) {
      return { eligible: false, reason: 'NO_PRICE' }
    }

    // Rule 3: must have a computable price-per-unit
    if (pricePerUnit === null) {
      return { eligible: false, reason: 'NO_PRICE_PER_UNIT' }
    }

    // Rule 4: must belong to a category (we attach it from the category endpoint)
    if (!product.category || !product.category.slug?.trim()) {
      return { eligible: false, reason: 'NO_CATEGORY' }
    }

    return { eligible: true, reason: null }
  }
}
