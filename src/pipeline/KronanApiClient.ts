import type { KronanRawProduct, KronanCategory } from '../types/index.js'

const BASE_URL = 'https://api.kronan.is/api/v1'
const MAX_RETRIES = 5
// ~1 req/s. The API edge issues a 429 and then a hard 403 IP block if hit faster.
const MIN_REQUEST_INTERVAL_MS = 1_000
// Exponential backoff base for rate-limit (429/403) responses: 5s, 10s, 20s, 40s, ...
const BACKOFF_BASE_MS = 5_000

// Actual shape from GET /api/v1/categories/{slug}/products/
interface CategoryProductsResponse {
  name: string
  count: number
  page: number
  pageCount: number
  hasNextPage: boolean
  products: KronanRawProduct[]
}

/** One page of newly-seen (deduplicated) products yielded by streamProductPages(). */
export interface ProductPage {
  category: KronanCategory
  page: number
  pageCount: number
  products: KronanRawProduct[]
}

/**
 * HTTP client for the Krónan Public REST API.
 * Handles authentication, page-based pagination, throttling, and 429 retries.
 *
 * Real API shapes (from redoc):
 *   GET /categories/                  → KronanCategory[]  (plain array, no pagination wrapper)
 *   GET /categories/{slug}/products/  → CategoryProductsResponse  (page-based, field: "products")
 *   Product fields: sku, name, thumbnail, price, pricePerKilo, baseComparisonUnit,
 *                   image, chargedByWeight, qtyPerBaseCompUnit, categoryPath, brand
 */
export class KronanApiClient {
  private readonly token: string
  private lastRequestTime = 0

  constructor(token: string) {
    this.token = token
  }

  /** Fetch the category tree. Returns the top-level categories (each may have `children`). */
  async fetchCategories(): Promise<KronanCategory[]> {
    const data = await this.get<KronanCategory[]>(`${BASE_URL}/categories/`)
    return Array.isArray(data) ? data : []
  }

  /**
   * Flatten the category tree to its leaf categories.
   * Only leaf categories accept the /products/ endpoint — requesting products
   * for a parent category returns "404 ... is not a leaf category".
   */
  private collectLeafCategories(categories: KronanCategory[]): KronanCategory[] {
    const leaves: KronanCategory[] = []
    for (const category of categories) {
      if (category.children && category.children.length > 0) {
        leaves.push(...this.collectLeafCategories(category.children))
      } else {
        leaves.push(category)
      }
    }
    return leaves
  }

  /**
   * Stream products page-by-page across every leaf category, deduplicating by SKU.
   * Yields one batch per fetched page so callers can persist progress incrementally
   * instead of buffering the whole catalogue and losing everything on a late failure.
   */
  async *streamProductPages(): AsyncGenerator<ProductPage> {
    const tree = await this.fetchCategories()
    const categories = this.collectLeafCategories(tree)
    const seenSkus = new Set<string>()

    for (const category of categories) {
      let page = 1

      while (true) {
        if (page === 1) {
          console.log(`  Fetching: ${category.name} (${category.slug})`)
        }
        const url = `${BASE_URL}/categories/${encodeURIComponent(category.slug)}/products/?page=${page}`
        const data = await this.get<CategoryProductsResponse>(url)

        const products: KronanRawProduct[] = []
        for (const product of data.products ?? []) {
          if (seenSkus.has(product.sku)) continue
          seenSkus.add(product.sku)
          // The category endpoint doesn't echo category context on each product.
          if (!product.category) {
            product.category = { slug: category.slug, name: category.name }
          }
          products.push(product)
        }

        yield { category, page, pageCount: data.pageCount, products }

        if (!data.hasNextPage) break
        page++
      }
    }
  }

  private async get<T>(url: string, attempt = 1): Promise<T> {
    await this.throttle()

    const response = await fetch(url, {
      headers: {
        Authorization: `AccessToken ${this.token}`,
        Accept: 'application/json',
      },
    })

    // 429 = rate limited; 403 = the edge proxy's hard block after sustained 429s.
    // The token is valid (a bad token returns 401), so treat 403 as a rate block too.
    if (response.status === 429 || response.status === 403) {
      if (attempt > MAX_RETRIES) {
        throw new Error(
          `Rate limit / block not cleared after ${MAX_RETRIES} retries for ${url}\n` +
            `${await this.readBody(response)}`
        )
      }
      // Exponential backoff, honouring Retry-After when the server provides it.
      const backoff = BACKOFF_BASE_MS * 2 ** (attempt - 1)
      const wait = Math.max(this.parseRetryAfter(response) ?? 0, backoff)
      console.warn(
        `  Rate limited (HTTP ${response.status}) — waiting ${Math.round(wait / 1000)}s ` +
          `(retry ${attempt}/${MAX_RETRIES})...`
      )
      await this.sleep(wait)
      return this.get<T>(url, attempt + 1)
    }

    if (response.status === 401) {
      throw new Error('Invalid API token. Check your KRONAN_API_TOKEN environment variable.')
    }

    if (response.status >= 500) {
      if (attempt <= 1) {
        console.warn(`  Server error ${response.status}, retrying in 5s...`)
        await this.sleep(5000)
        return this.get<T>(url, attempt + 1)
      }
      throw new Error(`Server error ${response.status} for ${url}\n${await this.readBody(response)}`)
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}\n${await this.readBody(response)}`)
    }

    return response.json() as Promise<T>
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await this.sleep(MIN_REQUEST_INTERVAL_MS - elapsed)
    }
    this.lastRequestTime = Date.now()
  }

  private async readBody(response: Response): Promise<string> {
    try {
      const text = await response.text()
      return text.trim().length > 0 ? `Response body: ${text}` : 'Response body: <empty>'
    } catch {
      return 'Response body: <unable to read>'
    }
  }

  private parseRetryAfter(response: Response): number | null {
    const header = response.headers.get('Retry-After')
    if (!header) return null
    const seconds = parseInt(header, 10)
    return isNaN(seconds) ? null : seconds * 1000
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
