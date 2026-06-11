import { useMemo } from 'react'
import { deriveCategories } from '../services/productPoolService.js'
import type { GameProduct } from '../types/index.js'
import styles from './CategoryPicker.module.css'

interface CategoryPickerProps {
  products: GameProduct[]
  selected: string[]
  onToggle: (slug: string) => void
}

export function CategoryPicker({ products, selected, onToggle }: CategoryPickerProps) {
  const categories = useMemo(() => deriveCategories(products), [products])

  return (
    <div className={styles.container} data-testid="category-picker">
      <ul
        className={styles.list}
        role="listbox"
        aria-multiselectable="true"
        aria-label="Velja flokka"
      >
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.slug)
          return (
            <li
              key={cat.slug}
              role="option"
              aria-selected={isSelected}
              className={`${styles.item} ${isSelected ? styles.selected : ''}`}
              onClick={() => onToggle(cat.slug)}
              data-testid={`category-item-${cat.slug}`}
            >
              <span className={styles.check} aria-hidden="true">
                {isSelected ? '☑' : '☐'}
              </span>
              <span className={styles.catName}>{cat.name}</span>
              <span className={styles.count}>({cat.productCount})</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
