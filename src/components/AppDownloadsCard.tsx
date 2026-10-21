import { Download } from 'lucide-react'
import { Pie, PieChart } from 'recharts'

import { useAppDownloads } from '@/api/downloads'
import MockBadge from '@/components/MockBadge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const config = {
  android: { label: 'Android', color: 'var(--chart-3)' },
  ios: { label: 'iOS', color: 'var(--chart-2)' },
} satisfies ChartConfig

const count = new Intl.NumberFormat('en-IN')

/** Customer app installs on Android and iOS, with each store's share. */
export default function AppDownloadsCard() {
  const { android, ios, isMock } = useAppDownloads()
  const total = android + ios
  const share = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const data = [
    { platform: 'android', count: android, fill: 'var(--color-android)' },
    { platform: 'ios', count: ios, fill: 'var(--color-ios)' },
  ]

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-4" aria-hidden />
          Customer app downloads
        </CardTitle>
        <CardDescription>Installs of the customer app from Google Play and the App Store.</CardDescription>
        {isMock && (
          <CardAction>
            <MockBadge />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[1fr_12rem]">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold tabular-nums">{count.format(total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Android</p>
            <p className="text-2xl font-semibold tabular-nums">{count.format(android)}</p>
            <p className="text-xs text-muted-foreground">{share(android)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">iOS</p>
            <p className="text-2xl font-semibold tabular-nums">{count.format(ios)}</p>
            <p className="text-xs text-muted-foreground">{share(ios)}%</p>
          </div>
        </div>
        <ChartContainer config={config} className="mx-auto h-40 w-full max-w-48">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="platform" hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="platform" innerRadius={40} strokeWidth={2} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
