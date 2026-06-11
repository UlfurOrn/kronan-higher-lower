import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import type { GameProduct, PipelineSummary, RejectionReason } from '../types/index.js'

/**
 * Writes the filtered product dataset to products.json and prints a summary.
 */
export class ProductDatasetWriter {
  async write(products: GameProduct[], outputPath: string): Promise<void> {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, JSON.stringify(products, null, 2), 'utf-8')
  }

  printSummary(summary: PipelineSummary): void {
    const reasons: RejectionReason[] = ['NO_IMAGE', 'NO_PRICE', 'NO_PRICE_PER_UNIT', 'NO_CATEGORY']
    const lines = [
      '',
      'Pipeline complete.',
      `Total fetched:   ${summary.totalFetched}`,
      `Total included:  ${summary.totalIncluded}`,
      `Total excluded:  ${summary.totalExcluded}`,
    ]
    for (const reason of reasons) {
      const count = summary.exclusionReasons[reason] ?? 0
      if (count > 0) {
        lines.push(`  - ${reason.padEnd(20)} ${count}`)
      }
    }
    console.log(lines.join('\n'))
  }
}
