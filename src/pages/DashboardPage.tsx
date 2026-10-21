import type { ReactNode } from 'react'
import { ClipboardCheck, Package, TrendingDown, TrendingUp, Users } from 'lucide-react'

import { useCatalogStatusQuery, usePendingProposalCountQuery } from '@/api/catalog-api'
import { useCustomerStatsQuery } from '@/api/stats-api'
import AppDownloadsCard from '@/components/AppDownloadsCard'
import ErrorNote from '@/components/ErrorNote'
import PeakHoursCard from '@/components/PeakHoursCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** "+12.5%" with an arrow, so the direction never rests on colour. "None yet" when last week had no sign-ups. */
const Growth = ({ percent }: { percent: number | null }) => {
  if (percent === null) return <span className="text-base font-normal text-muted-foreground">No sign-ups last week</span>
  const Icon = percent < 0 ? TrendingDown : TrendingUp
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-5" aria-hidden />
      {percent > 0 ? '+' : ''}
      {percent}%
    </span>
  )
}

const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold tabular-nums">{value}</p>
  </div>
)

/** The signed-in home: live figures from localMart-BE. */
export default function DashboardPage() {
  const catalog = useCatalogStatusQuery()
  const proposals = usePendingProposalCountQuery()
  const visitors = useCustomerStatsQuery()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" aria-hidden />
            Visitors
          </CardTitle>
          <CardDescription>Customer accounts: who signed up and who is using the app.</CardDescription>
        </CardHeader>
        <CardContent>
          {visitors.isError ? (
            <ErrorNote error={visitors.error} />
          ) : visitors.data ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Total visitors" value={visitors.data.total} />
              <Stat label="New this week" value={visitors.data.newThisWeek} />
              <Stat label="Weekly growth" value={<Growth percent={visitors.data.weeklyGrowthPercent} />} />
              <Stat label="Active today" value={visitors.data.activeToday} />
            </div>
          ) : (
            <Skeleton className="h-14 w-full" />
          )}
        </CardContent>
      </Card>

      <PeakHoursCard />

      <AppDownloadsCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" aria-hidden />
            Catalogue
          </CardTitle>
          <CardDescription>
            {catalog.data?.mode === 'live'
              ? 'Live: shoppers see stock, and sold-out products are hidden.'
              : 'Preview: no seller has stock yet, so every product is listed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {catalog.isError ? (
            <ErrorNote error={catalog.error} />
          ) : catalog.data ? (
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Products" value={catalog.data.total} />
              <Stat label="Available" value={catalog.data.available} />
              <Stat label="Sold out" value={catalog.data.unavailable} />
            </div>
          ) : (
            <Skeleton className="h-14 w-full" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4" aria-hidden />
            Merchant proposals
          </CardTitle>
          <CardDescription>Products merchants proposed, waiting for review.</CardDescription>
        </CardHeader>
        <CardContent>
          {proposals.isError ? (
            <ErrorNote error={proposals.error} />
          ) : proposals.data !== undefined ? (
            <Stat label="Waiting" value={proposals.data} />
          ) : (
            <Skeleton className="h-14 w-24" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
