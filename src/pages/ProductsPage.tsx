import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { errorMessage } from '@/api/base-api'
import { useCatalogProductsQuery } from '@/api/products-api'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const STEP = 24
/** localMart-BE's cap on one page of GET /api/products. */
const MAX_LIMIT = 100

/** Every catalogue product, drawn as the customer app shows it (GET /api/products). */
export default function ProductsPage() {
  const [limit, setLimit] = useState(STEP)
  const { data, isLoading, isFetching, error } = useCatalogProductsQuery({ limit })
  const shown = data?.products.length ?? 0
  const total = data?.meta?.total ?? shown
  const canLoadMore = shown < total && limit < MAX_LIMIT

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>
          {data ? `${shown} of ${total} products, as shoppers see them.` : 'Products shoppers can see.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
        ) : shown ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data?.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No products yet.</p>
        )}
        {canLoadMore && (
          <Button
            variant="outline"
            className="justify-self-center"
            disabled={isFetching}
            onClick={() => setLimit((n) => Math.min(n + STEP, MAX_LIMIT))}
          >
            {isFetching && <Loader2 className="animate-spin" aria-hidden />}
            Load more
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
