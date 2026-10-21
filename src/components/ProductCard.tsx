import { useState } from 'react'
import { PackagePlus } from 'lucide-react'

import { formatRupees } from '@/lib/format'
import { safeHttpUrl } from '@/lib/url'
import { cn } from '@/lib/utils'

/** What the card needs: a subset of a catalogue product, so a form draft fits too. */
export interface ProductCardData {
  name: string
  image: string
  pack?: string
  origin?: string
  useFor?: string
  requiresPrescription?: boolean
  price?: number
  stockCount?: number
  variants?: { id: string; label: string; price: number; stockCount: number }[]
}

/** The customer app's three stock states, in words. */
const stockText = (count: number): string =>
  count === 0 ? 'Out of stock' : count <= 5 ? `Only ${count} left` : `${count} in stock`

/**
 * One product as the customer app's home screen shows it: picture, name,
 * origin or pack, size chips for sized items, price and stock. Sized items
 * open on the first size with stock, as in the app. The cart control is a
 * look-alike, since an admin can't buy.
 */
export default function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const variants = product.variants ?? []
  const [picked, setPicked] = useState<string>()
  const variant =
    variants.find((v) => v.id === picked) ?? variants.find((v) => v.stockCount > 0) ?? variants[0]

  const price = variant?.price ?? product.price ?? 0
  const stock = variant?.stockCount ?? product.stockCount ?? 0
  const caption = product.origin ?? product.useFor
  const image = safeHttpUrl(product.image) ?? (product.image.startsWith('/') ? product.image : undefined)

  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border border-neutral-500 bg-neutral-600 p-3 text-neutral-100', className)}>
      <div
        className={cn(
          'flex aspect-[1.6] items-center justify-center overflow-hidden rounded-lg bg-neutral-700',
          image && stock === 0 && 'opacity-45',
        )}
      >
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <PackagePlus className="size-8 text-neutral-200" aria-hidden />
        )}
      </div>
      <p className="mt-1 line-clamp-2 min-h-10 font-semibold leading-5">{product.name || 'Product name'}</p>
      {(caption || (product.pack && !variant)) && (
        <p className="text-xs text-neutral-200">
          {caption}
          {product.pack && !variant ? `${caption ? ' · ' : ''}${product.pack}` : ''}
        </p>
      )}
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Sizes">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variant?.id}
              onClick={() => setPicked(v.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs',
                v.id === variant?.id
                  ? 'border-neutral-100 bg-neutral-100 text-neutral-900'
                  : 'border-neutral-300 text-neutral-100',
              )}
            >
              {v.label}
              {v.stockCount === 0 ? ' (sold out)' : ''}
            </button>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div>
          <p className="font-semibold">{formatRupees(price)}</p>
          <p className="text-xs text-neutral-200">{stockText(stock)}</p>
        </div>
        <span className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium">
          {product.requiresPrescription ? 'Upload Rx' : 'Add'}
        </span>
      </div>
    </div>
  )
}
