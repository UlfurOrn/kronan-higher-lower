import type { GameProduct, Category } from '../types/index.js'

/**
 * Pure utility functions for building and sampling the product pool.
 */

export function buildPool(
  products: GameProduct[],
  category: string | null
): GameProduct[] {
  const eligible = products.filter(
    (p) => p.imageUrl.trim() !== '' && p.pricePerUnit > 0
  )
  if (category === null) return eligible
  return eligible.filter((p) => p.categorySlug === category)
}

export function pickInitialPair(
  pool: GameProduct[]
): { left: GameProduct; right: GameProduct } {
  if (pool.length < 2) {
    throw new Error('Pool must contain at least 2 products to pick an initial pair.')
  }
  const leftIdx = randomIndex(pool.length)
  let rightIdx = randomIndex(pool.length)
  while (rightIdx === leftIdx) {
    rightIdx = randomIndex(pool.length)
  }
  return { left: pool[leftIdx], right: pool[rightIdx] }
}

export function pickNextProduct(
  pool: GameProduct[],
  exclude: GameProduct
): GameProduct {
  const candidates = pool.filter((p) => p.sku !== exclude.sku)
  if (candidates.length === 0) {
    // Edge case: only 1 product in pool — should not happen due to BR-02-C
    return exclude
  }
  return candidates[randomIndex(candidates.length)]
}

export function deriveCategories(products: GameProduct[]): Category[] {
  const map = new Map<string, Category>()

  for (const product of products) {
    const existing = map.get(product.categorySlug)
    if (existing) {
      existing.productCount++
    } else {
      map.set(product.categorySlug, {
        slug: product.categorySlug,
        name: product.categoryName,
        productCount: 1,
      })
    }
  }

  return Array.from(map.values())
    .filter((c) => c.productCount >= 2)
    .sort((a, b) => a.name.localeCompare(b.name, 'is'))
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}
