import { Clock } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { usePeakHoursQuery } from '@/api/stats-api'
import ErrorNote from '@/components/ErrorNote'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

const config = { count: { label: 'Customers', color: 'var(--chart-3)' } } satisfies ChartConfig

/** 0 -> "12 AM", 13 -> "1 PM". */
const hourLabel = (hour: number): string => `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`

/** When customers open the customer app: last sign-ins by hour of day. */
export default function PeakHoursCard() {
  const { data, isError, error } = usePeakHoursQuery()
  const total = data?.hours.reduce((sum, h) => sum + h.count, 0) ?? 0

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4" aria-hidden />
          Peak time
        </CardTitle>
        <CardDescription>
          {data?.peakHour != null
            ? `Customers open the app most around ${hourLabel(data.peakHour)}. Last sign-ins from the past ${data.windowDays} days, India time.`
            : 'When customers open the customer app, by hour of day.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorNote error={error} />
        ) : !data ? (
          <Skeleton className="h-56 w-full" />
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">No sign-ins in the past {data.windowDays} days yet.</p>
        ) : (
          <ChartContainer config={config} className="h-56 w-full">
            <BarChart data={data.hours} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={2}
                tickFormatter={hourLabel}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelFormatter={(_, items) => hourLabel(items[0]?.payload.hour)} />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
