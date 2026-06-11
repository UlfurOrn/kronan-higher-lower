import { resolve } from 'path'
import { KronanApiClient } from './KronanApiClient.js'
import { PricePerUnitCalculator } from './PricePerUnitCalculator.js'
import { ProductFilter } from './ProductFilter.js'
import { ProductDatasetWriter } from './ProductDatasetWriter.js'
import type {
  GameProduct,
  PipelineSummary,
  RejectionReason,
} from '../types/index.js'

const OUTPUT_PATH = resolve(process.cwd(), 'src/data/products.json')
const MIN_DATASET_WARNING = 10

/**
 * Coordinates the full data pipeline:
 * fetch → deduplicate → compute price-per-unit → filter → write → summarise
 */
export class PipelineOrchestrator {
  async run(): Promise<void> {
    this.validateEnv()

    const token = process.env.KRONAN_API_TOKEN!
    const client = new KronanApiClient(token)
    const calculator = new PricePerUnitCalculator()
    const filter = new ProductFilter()
    const writer = new ProductDatasetWriter()

    console.log('Fetching products from Krónan API...')

    const eligible: GameProduct[] = []
    const exclusionReasons: Record<RejectionReason, number> = {
      NO_IMAGE: 0,
      NO_PRICE: 0,
      NO_PRICE_PER_UNIT: 0,
      NO_CATEGORY: 0,
    }
    let totalFetched = 0

    // Stream page-by-page and persist after each page, so a mid-run failure
    // (e.g. a rate-limit block) keeps everything fetched up to that point.
    for await (const { category, page, pageCount, products } of client.streamProductPages()) {
      for (const raw of products) {
        totalFetched++
        const pricePerUnit = calculator.compute(raw)
        const result = filter.check(raw, pricePerUnit)

        if (result.eligible && pricePerUnit !== null && raw.category) {
          eligible.push({
            sku: raw.sku,
            name: raw.name,
            categorySlug: raw.category.slug,
            categoryName: raw.category.name,
            imageUrl: raw.image?.trim() || raw.thumbnail?.trim() || '',
            priceIsk: raw.price!,
            pricePerUnit: pricePerUnit.value,
            unitLabel: pricePerUnit.unitLabel,
          })
          console.log(
            `    ✓ ${raw.name} — ${pricePerUnit.value} ${pricePerUnit.unitLabel} (included)`
          )
        } else if (result.reason) {
          exclusionReasons[result.reason]++
          console.log(`    ✗ ${raw.name} (excluded: ${result.reason})`)
        }
      }

      await writer.write(eligible, OUTPUT_PATH)
      console.log(
        `  Saved page ${page}/${pageCount} of ${category.name} — ` +
          `${products.length} new product(s) consumed, ${eligible.length} eligible so far → ${OUTPUT_PATH}`
      )
    }

    const summary: PipelineSummary = {
      totalFetched,
      totalIncluded: eligible.length,
      totalExcluded: totalFetched - eligible.length,
      exclusionReasons,
    }

    if (eligible.length < MIN_DATASET_WARNING) {
      console.warn(
        `Warning: only ${eligible.length} products passed filtering (minimum recommended: ${MIN_DATASET_WARNING}).`
      )
    }

    writer.printSummary(summary)
  }

  private validateEnv(): void {
    const token = process.env.KRONAN_API_TOKEN
    if (!token || token.trim() === '') {
      console.error(
        'Error: KRONAN_API_TOKEN environment variable is not set.\n' +
          'Create an API token at https://kronan.is (Settings → API tokens)\n' +
          'Then run: KRONAN_API_TOKEN=your_token npm run fetch-data'
      )
      process.exit(1)
    }
  }
}
