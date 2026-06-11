import { ProductImage } from './ProductImage.js'
import type { GameProduct } from '../types/index.js'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: GameProduct
  revealed: boolean
  variant: 'neutral' | 'correct' | 'incorrect'
  position: 'left' | 'right'
}

export function ProductCard({ product, revealed, variant, position }: ProductCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]}`}
      data-testid={`product-card-${position}`}
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        className={styles.cardImage}
      />
      <div className={styles.info}>
        <p className={styles.categoryName}>{product.categoryName}</p>
        <h2 className={styles.productName}>{product.name}</h2>
        <div className={styles.priceBlock}>
          {revealed ? (
            <>
              <span className={styles.price}>{product.pricePerUnit.toLocaleString('is')}</span>
              <span className={styles.unitLabel}>{product.unitLabel}</span>
            </>
          ) : (
            <span className={styles.mystery}>?</span>
          )}
        </div>
      </div>
    </div>
  )
}
