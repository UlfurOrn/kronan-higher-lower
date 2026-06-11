import { describe, it, expect } from 'vitest'
import {
  buildPool,
  pickInitialPair,
  pickNextProduct,
  deriveCategories,
} from '../productPoolService.js'
import type { GameProduct } from '../../types/index.js'

function makeProduct(
  sku: string,
  categorySlug: string,
  categoryName: string,
  overrides: Partial<GameProduct> = {}
): GameProduct {
  return {
    sku,
    name: `Vara ${sku}`,
    categorySlug,
    categoryName,
    imageUrl: 'https://example.com/img.jpg',
    priceIsk: 500,
    pricePerUnit: 500,
    unitLabel: 'kr/kg',
    ...overrides,
  }
}

const products: GameProduct[] = [
  makeProduct('p1', 'mjolk', 'Mjólk'),
  makeProduct('p2', 'mjolk', 'Mjólk'),
  makeProduct('p3', 'kjot', 'Kjöt'),
  makeProduct('p4', 'kjot', 'Kjöt'),
  makeProduct('p5', 'ostur', 'Ostur'), // only 1 in category
]

describe('buildPool', () => {
  it('returns all eligible products when category is null', () => {
    const pool = buildPool(products, null)
    expect(pool).toHaveLength(5)
  })

  it('filters by category slug', () => {
    const pool = buildPool(products, 'mjolk')
    expect(pool).toHaveLength(2)
    expect(pool.every((p) => p.categorySlug === 'mjolk')).toBe(true)
  })

  it('excludes products with empty imageUrl', () => {
    const withBadImage = [
      ...products,
      makeProduct('bad', 'mjolk', 'Mjólk', { imageUrl: '' }),
    ]
    const pool = buildPool(withBadImage, 'mjolk')
    expect(pool.every((p) => p.imageUrl !== '')).toBe(true)
  })

  it('excludes products with zero pricePerUnit', () => {
    const withZeroPrice = [
      ...products,
      makeProduct('zero', 'mjolk', 'Mjólk', { pricePerUnit: 0 }),
    ]
    const pool = buildPool(withZeroPrice, 'mjolk')
    expect(pool.every((p) => p.pricePerUnit > 0)).toBe(true)
  })

  it('returns empty array for category with no products', () => {
    const pool = buildPool(products, 'nonexistent')
    expect(pool).toHaveLength(0)
  })
})

describe('pickInitialPair', () => {
  it('returns two distinct products', () => {
    const pair = pickInitialPair(products)
    expect(pair.left.sku).not.toBe(pair.right.sku)
  })

  it('throws when pool has fewer than 2 products', () => {
    expect(() => pickInitialPair([products[0]])).toThrow()
  })

  it('works with exactly 2 products', () => {
    const pair = pickInitialPair([products[0], products[1]])
    expect(pair.left.sku).not.toBe(pair.right.sku)
  })
})

describe('pickNextProduct', () => {
  it('returns a product different from the excluded one', () => {
    const next = pickNextProduct(products, products[0])
    expect(next.sku).not.toBe(products[0].sku)
  })

  it('handles single-product pool gracefully (returns exclude)', () => {
    const next = pickNextProduct([products[0]], products[0])
    expect(next.sku).toBe(products[0].sku)
  })

  it('always returns a product from the pool', () => {
    const skus = new Set(products.map((p) => p.sku))
    for (let i = 0; i < 20; i++) {
      const next = pickNextProduct(products, products[0])
      expect(skus.has(next.sku)).toBe(true)
    }
  })
})

describe('deriveCategories', () => {
  it('only returns categories with >= 2 products', () => {
    const categories = deriveCategories(products)
    expect(categories.find((c) => c.slug === 'ostur')).toBeUndefined()
    expect(categories.find((c) => c.slug === 'mjolk')).toBeDefined()
    expect(categories.find((c) => c.slug === 'kjot')).toBeDefined()
  })

  it('returns correct product counts', () => {
    const categories = deriveCategories(products)
    const mjolk = categories.find((c) => c.slug === 'mjolk')!
    expect(mjolk.productCount).toBe(2)
  })

  it('sorts alphabetically by name', () => {
    const categories = deriveCategories(products)
    const names = categories.map((c) => c.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'is')))
  })
})
