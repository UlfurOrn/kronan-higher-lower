import type { KronanRawProduct, PricePerUnitResult } from '../types/index.js'

/**
 * Derives a normalised price-per-unit value from a real Krónan API product record.
 *
 * The Krónan API already provides:
 *   - pricePerKilo: price per kg (when the product is sold by weight)
 *   - baseComparisonUnit: e.g. "100g", "l", "stk", "100ml"
 *   - qtyPerBaseCompUnit: quantity per that unit
 *   - chargedByWeight: true for loose weight products
 *   - priceInfo: human-readable e.g. "398 kr/kg" (informational only)
 *
 * Strategy:
 *   1. If pricePerKilo is set and > 0 → use it as kr/kg
 *   2. If baseComparisonUnit indicates litres → compute kr/l from price + qtyPerBaseCompUnit
 *   3. Fall back to price per piece (kr/stk)
 *   4. Return null if nothing can be computed
 */
export class PricePerUnitCalculator {
  compute(product: KronanRawProduct): PricePerUnitResult | null {
    const price = product.price
    if (price === null || price <= 0) return null

    // --- Strategy 1: API gives us pricePerKilo directly ---
    if (product.pricePerKilo !== null && product.pricePerKilo > 0) {
      return { value: Math.round(product.pricePerKilo), unitLabel: 'kr/kg' }
    }

    // --- Strategy 2: Derive from baseComparisonUnit ---
    const bcu = (product.baseComparisonUnit ?? '').trim().toLowerCase()
    const qty = product.qtyPerBaseCompUnit

    // Litre-based
    if (bcu === 'l' || bcu === 'litre' || bcu === 'liter') {
      // qty is the number of litres the product contains → price per litre = price / qty
      if (qty && qty > 0) {
        return this.guard({ value: Math.round(price / qty), unitLabel: 'kr/l' })
      }
      return this.guard({ value: Math.round(price), unitLabel: 'kr/l' })
    }

    if (bcu === 'dl') {
      if (qty && qty > 0) {
        return this.guard({ value: Math.round((price / qty) * 10), unitLabel: 'kr/l' })
      }
    }

    if (bcu === 'cl') {
      if (qty && qty > 0) {
        return this.guard({ value: Math.round((price / qty) * 100), unitLabel: 'kr/l' })
      }
    }

    if (bcu === 'ml' || bcu === '100ml') {
      if (qty && qty > 0) {
        const mlQty = bcu === '100ml' ? qty * 100 : qty
        return this.guard({ value: Math.round((price / mlQty) * 1000), unitLabel: 'kr/l' })
      }
    }

    // Gram-based (not covered by pricePerKilo — shouldn't normally happen but be safe)
    if (bcu === '100g' || bcu === 'g' || bcu === 'gram') {
      if (qty && qty > 0) {
        const gQty = bcu === '100g' ? qty * 100 : qty
        return this.guard({ value: Math.round((price / gQty) * 1000), unitLabel: 'kr/kg' })
      }
    }

    // --- Strategy 3: Piece/unit products ---
    if (
      bcu === 'stk' ||
      bcu === 'stykki' ||
      bcu === 'pk' ||
      bcu === 'pcs' ||
      bcu === 'each' ||
      bcu === '' ||
      bcu === 'stk.'
    ) {
      return this.guard({ value: Math.round(price), unitLabel: 'kr/stk' })
    }

    // If baseComparisonUnit is set but unrecognised, fall back to piece
    if (bcu && bcu.length > 0) {
      // Unknown unit — still usable as kr/stk for comparison purposes
      return this.guard({ value: Math.round(price), unitLabel: 'kr/stk' })
    }

    // No unit info at all — treat as piece
    return this.guard({ value: Math.round(price), unitLabel: 'kr/stk' })
  }

  private guard(result: PricePerUnitResult): PricePerUnitResult | null {
    if (result.value <= 0) return null
    return result
  }
}
