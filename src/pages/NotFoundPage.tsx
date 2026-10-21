import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <SearchX className="mb-2 size-8 text-muted-foreground" aria-hidden />
          <CardTitle>Page not found</CardTitle>
          <CardDescription>There is nothing at this address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeft aria-hidden />
            Back to the dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
