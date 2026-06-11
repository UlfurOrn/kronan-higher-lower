import { describe, it, expect } from 'vitest'
import { PricePerUnitCalculator } from '../PricePerUnitCalculator.js'
import type { KronanRawProduct } from '../../types/index.js'

const calculator = new PricePerUnitCalculator()

function makeProduct(overrides: Partial<KronanRawProduct>): KronanRawProduct {
  return {
    sku: 'TEST-001',
    name: 'Test vara',
    category: { slug: 'test', name: 'Test' },
    images: [{ url: 'https://example.com/img.jpg' }],
    price: 1000,
    unit: null,
    unitSize: null,
    ...overrides,
  }
}

describe('PricePerUnitCalculator', () => {
  describe('kg products', () => {
    it('returns price as-is for kg unit', () => {
      const result = calculator.compute(makeProduct({ unit: 'kg', price: 1500 }))
      expect(result).toEqual({ value: 1500, unitLabel: 'kr/kg' })
    })

    it('converts grams to kg price', () => {
      // 500g for 750 ISK → 1500 kr/kg
      const result = calculator.compute(makeProduct({ unit: 'g', price: 750, unitSize: 500 }))
      expect(result).toEqual({ value: 1500, unitLabel: 'kr/kg' })
    })

    it('converts 100g to kg price', () => {
      // 100g for 200 ISK → 2000 kr/kg
      const result = calculator.compute(makeProduct({ unit: '100g', price: 200 }))
      expect(result).toEqual({ value: 2000, unitLabel: 'kr/kg' })
    })

    it('returns null for g unit with null unitSize', () => {
      const result = calculator.compute(makeProduct({ unit: 'g', price: 500, unitSize: null }))
      expect(result).toBeNull()
    })

    it('returns null for g unit with zero unitSize', () => {
      const result = calculator.compute(makeProduct({ unit: 'g', price: 500, unitSize: 0 }))
      expect(result).toBeNull()
    })
  })

  describe('litre products', () => {
    it('returns price as-is for l unit', () => {
      const result = calculator.compute(makeProduct({ unit: 'l', price: 300 }))
      expect(result).toEqual({ value: 300, unitLabel: 'kr/l' })
    })

    it('converts dl to litre price', () => {
      // per dl → multiply by 10
      const result = calculator.compute(makeProduct({ unit: 'dl', price: 50 }))
      expect(result).toEqual({ value: 500, unitLabel: 'kr/l' })
    })

    it('converts cl to litre price', () => {
      const result = calculator.compute(makeProduct({ unit: 'cl', price: 5 }))
      expect(result).toEqual({ value: 500, unitLabel: 'kr/l' })
    })

    it('converts ml to litre price', () => {
      // 330ml for 250 ISK → ~758 kr/l
      const result = calculator.compute(makeProduct({ unit: 'ml', price: 250, unitSize: 330 }))
      expect(result?.unitLabel).toBe('kr/l')
      expect(result?.value).toBe(758)
    })
  })

  describe('piece products', () => {
    it('returns price as-is for stk unit', () => {
      const result = calculator.compute(makeProduct({ unit: 'stk', price: 499 }))
      expect(result).toEqual({ value: 499, unitLabel: 'kr/stk' })
    })

    it('returns price as-is for empty unit string', () => {
      const result = calculator.compute(makeProduct({ unit: '', price: 299 }))
      expect(result).toEqual({ value: 299, unitLabel: 'kr/stk' })
    })

    it('returns price as-is for null unit', () => {
      const result = calculator.compute(makeProduct({ unit: null, price: 399 }))
      expect(result).toEqual({ value: 399, unitLabel: 'kr/stk' })
    })

    it('handles pk unit', () => {
      const result = calculator.compute(makeProduct({ unit: 'pk', price: 599 }))
      expect(result).toEqual({ value: 599, unitLabel: 'kr/stk' })
    })
  })

  describe('unknown / invalid cases', () => {
    it('returns null for unknown unit type', () => {
      const result = calculator.compute(makeProduct({ unit: 'furlong', price: 100 }))
      expect(result).toBeNull()
    })

    it('returns null when price is null', () => {
      const result = calculator.compute(makeProduct({ price: null }))
      expect(result).toBeNull()
    })

    it('returns null when price is zero', () => {
      const result = calculator.compute(makeProduct({ price: 0, unit: 'kg' }))
      expect(result).toBeNull()
    })

    it('returns null when price is negative', () => {
      const result = calculator.compute(makeProduct({ price: -100, unit: 'kg' }))
      expect(result).toBeNull()
    })

    it('rounds result to nearest integer', () => {
      // 333g for 500 ISK → 500/333*1000 ≈ 1502.0 → 1502
      const result = calculator.compute(makeProduct({ unit: 'g', price: 500, unitSize: 333 }))
      expect(result?.value).toBe(1502)
    })
  })
})
