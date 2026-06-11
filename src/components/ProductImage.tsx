import { useState } from 'react'
import styles from './ProductImage.module.css'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [errored, setErrored] = useState(false)

  return (
    <img
      src={errored ? '/placeholder.svg' : src}
      alt={alt}
      className={`${styles.image} ${className ?? ''}`}
      onError={() => setErrored(true)}
      data-testid="product-image"
    />
  )
}
