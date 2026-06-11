import { useMemo } from 'react'
import { deriveCategories } from '../services/productPoolService.js'
import type { GameProduct } from '../types/index.js'
import styles from './CategoryPicker.module.css'

interface CategoryPickerProps {
  products: GameProduct[]
  selected: string | null
  onSelect: (slug: string) => void
}

export function CategoryPicker({ products, selected, onSelect }: CategoryPickerProps) {
  const categories = useMemo(() => deriveCategories(products), [products])

  return (
    <div className={styles.container} data-testid="category-picker">
      <ul className={styles.list} role="listbox" aria-label="Velja flokk">
        {categories.map((cat) => (
          <li
            key={cat.slug}
            role="option"
            aria-selected={selected === cat.slug}
            className={`${styles.item} ${selected === cat.slug ? styles.selected : ''}`}
            onClick={() => onSelect(cat.slug)}
            data-testid={`category-item-${cat.slug}`}
          >
            <span className={styles.catName}>{cat.name}</span>
            <span className={styles.count}>({cat.productCount})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
