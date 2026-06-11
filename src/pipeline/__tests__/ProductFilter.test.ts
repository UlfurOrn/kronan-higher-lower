import { describe, it, expect } from 'vitest'
import { ProductFilter } from '../ProductFilter.js'
import type { KronanRawProduct, PricePerUnitResult } from '../../types/index.js'

const filter = new ProductFilter()

const validPpu: PricePerUnitResult = { value: 1500, unitLabel: 'kr/kg' }

function makeProduct(overrides: Partial<KronanRawProduct>): KronanRawProduct {
  return {
    sku: 'TEST-001',
    name: 'Test vara',
    category: { slug: 'mjolk', name: 'Mjólk' },
    images: [{ url: 'https://example.com/img.jpg' }],
    price: 500,
    unit: 'kg',
    unitSize: null,
    ...overrides,
  }
}

describe('ProductFilter', () => {
  it('accepts a fully valid product', () => {
    const result = filter.check(makeProduct({}), validPpu)
    expect(result).toEqual({ eligible: true, reason: null })
  })

  describe('NO_IMAGE', () => {
    it('rejects product with empty images array', () => {
      const result = filter.check(makeProduct({ images: [] }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_IMAGE' })
    })

    it('rejects product with empty image URL', () => {
      const result = filter.check(makeProduct({ images: [{ url: '' }] }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_IMAGE' })
    })

    it('rejects product with whitespace-only image URL', () => {
      const result = filter.check(makeProduct({ images: [{ url: '   ' }] }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_IMAGE' })
    })
  })

  describe('NO_PRICE', () => {
    it('rejects product with null price', () => {
      const result = filter.check(makeProduct({ price: null }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_PRICE' })
    })

    it('rejects product with zero price', () => {
      const result = filter.check(makeProduct({ price: 0 }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_PRICE' })
    })

    it('rejects product with negative price', () => {
      const result = filter.check(makeProduct({ price: -1 }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_PRICE' })
    })
  })

  describe('NO_PRICE_PER_UNIT', () => {
    it('rejects product when pricePerUnit is null', () => {
      const result = filter.check(makeProduct({}), null)
      expect(result).toEqual({ eligible: false, reason: 'NO_PRICE_PER_UNIT' })
    })
  })

  describe('NO_CATEGORY', () => {
    it('rejects product with null category', () => {
      const result = filter.check(makeProduct({ category: null }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_CATEGORY' })
    })

    it('rejects product with empty category slug', () => {
      const result = filter.check(makeProduct({ category: { slug: '', name: 'Test' } }), validPpu)
      expect(result).toEqual({ eligible: false, reason: 'NO_CATEGORY' })
    })
  })

  it('checks rules in order (NO_IMAGE before NO_PRICE)', () => {
    const result = filter.check(makeProduct({ images: [], price: null }), null)
    expect(result.reason).toBe('NO_IMAGE')
  })
})
