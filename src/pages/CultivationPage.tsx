import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

import {
  CULTIVATION_STAGES,
  useCropCatalogQuery,
  useCultivationQuery,
  type CultivationRecord,
} from '@/api/cultivation-api'
import ErrorNote from '@/components/ErrorNote'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDay } from '@/lib/format'

const ALL = 'all'
const STAGE_TABS = [{ value: ALL, label: 'All' }, ...CULTIVATION_STAGES] as const
type StageTab = (typeof STAGE_TABS)[number]['value']

/** What the status column says: the stage, and for a growing crop how long is left. */
function StageBadge({ record }: { record: CultivationRecord }) {
  if (record.stage === 'ready') return <Badge>Ready to harvest</Badge>
  if (record.stage === 'harvested') return <Badge variant="outline">Harvested</Badge>
  const days = record.daysToHarvest ?? 0
  return <Badge variant="outline">{`${days} day${days === 1 ? '' : 's'} to go`}</Badge>
}

/** Waits for typing to pause before searching, so each keystroke isn't a request. */
function useDebounced(value: string, ms = 300): string {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return settled
}

/** Every farmer's crops: what is growing, what is ready to harvest, and what was harvested. */
export default function CultivationPage() {
  const [stage, setStage] = useState<StageTab>(ALL)
  const [crop, setCrop] = useState(ALL)
  const [typed, setTyped] = useState('')
  const search = useDebounced(typed.trim())

  // The page number belongs to one set of filters: change any of them and
  // the list starts again from page 1.
  const filterKey = `${stage}|${crop}|${search}`
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1
  const goTo = (next: number) => setPaging({ key: filterKey, page: next })

  const catalog = useCropCatalogQuery()
  const { data, isFetching, isError, error } = useCultivationQuery({
    page,
    ...(stage !== ALL ? { stage } : {}),
    ...(crop !== ALL ? { crop } : {}),
    ...(search ? { search } : {}),
  })

  const cropItems = [
    { value: ALL, label: 'All crops' },
    ...(catalog.data ?? []).map((c) => ({ value: c.slug, label: c.label })),
  ]
  const stages = data?.meta.stages
  const tabCount = (value: StageTab): number | undefined =>
    stages && (value === ALL ? stages.growing + stages.ready + stages.harvested : stages[value])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cultivation records</CardTitle>
        <CardDescription>What every farmer has planted, and when each crop should be ready.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={stage}
            onValueChange={(value) => {
              const next = STAGE_TABS.find((t) => t.value === value)
              if (next) setStage(next.value)
            }}
          >
            <TabsList>
              {STAGE_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {tabCount(t.value) !== undefined ? ` (${tabCount(t.value)})` : ''}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select
            items={cropItems}
            value={crop}
            onValueChange={(value) => {
              const next = cropItems.find((c) => c.value === value)
              if (next) setCrop(next.value)
            }}
          >
            <SelectTrigger aria-label="Filter by crop" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cropItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 opacity-70" aria-hidden />
            <Input
              aria-label="Search by farmer, village or district"
              placeholder="Farmer, village or district"
              className="pl-8"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>

        {isError ? (
          <ErrorNote error={error} />
        ) : !data ? (
          <div className="grid gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {stage === ALL && crop === ALL && !search ? 'No farmer has recorded a crop yet.' : 'No crops match these filters.'}
          </p>
        ) : (
          <>
            <Table aria-busy={isFetching}>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Planted</TableHead>
                  <TableHead>Harvest</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="grid">
                        <span className="font-medium">{r.farmer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {[r.farmer.place, r.farmer.phoneNumber].filter(Boolean).join(' · ') || 'No address given'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid">
                        <span>{r.cropLabel}</span>
                        {r.variety && <span className="text-xs text-muted-foreground">{r.variety}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.area !== undefined ? `${r.area} ${r.landUnit}` : <span className="text-muted-foreground">Not given</span>}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDay(r.plantedOn)}</TableCell>
                    <TableCell className="tabular-nums">
                      {r.harvestedOn ? (
                        formatDay(r.harvestedOn)
                      ) : (
                        <span>
                          <span className="text-muted-foreground">Expected </span>
                          {formatDay(r.expectedHarvestOn)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StageBadge record={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm">
                <span className="text-muted-foreground">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  disabled={page <= 1 || isFetching}
                  onClick={() => goTo(page - 1)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled={page >= data.meta.totalPages || isFetching}
                  onClick={() => goTo(page + 1)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
