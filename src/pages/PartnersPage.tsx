import { useState } from 'react'
import { Check, Info, X } from 'lucide-react'
import { toast } from 'sonner'

import { useMeQuery } from '@/api/auth-api'
import { errorMessage } from '@/api/base-api'
import {
  PARTNER_REVIEWERS,
  PROFILE_STATUSES,
  usePartnersQuery,
  useReviewPartnerMutation,
  type Partner,
  type PartnerKind,
  type ProfileStatus,
} from '@/api/partners-api'
import DocumentLink from '@/components/DocumentLink'
import ErrorNote from '@/components/ErrorNote'
import RejectDialog from '@/components/RejectDialog'
import StatusBadge from '@/components/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatArea } from '@/lib/format'

const FILTERS = [{ value: 'all', label: 'All statuses' }, ...PROFILE_STATUSES] as const
type Filter = (typeof FILTERS)[number]['value']

/**
 * All farmers' land together, per unit: "9 acre", or "9 acre + 2.5 hectare"
 * when they use different units, which can't simply be added. Farmers who
 * haven't entered their land are left out.
 */
const totalLand = (partners: Partner[]): string | undefined => {
  const byUnit = new Map<string, number>()
  for (const p of partners) {
    if (p.landSize !== undefined && p.landUnit) {
      byUnit.set(p.landUnit, (byUnit.get(p.landUnit) ?? 0) + p.landSize)
    }
  }
  return byUnit.size > 0
    ? [...byUnit].map(([unit, size]) => formatArea(size, unit)).join(' + ')
    : undefined
}

const COPY: Record<PartnerKind, { title: string; one: string; many: string }> = {
  merchants: { title: 'Merchants', one: 'merchant', many: 'merchants' },
  drivers: { title: 'Drivers', one: 'driver', many: 'drivers' },
  farmers: { title: 'Farmers', one: 'farmer', many: 'farmers' },
}

/**
 * Every merchant, driver or farmer account. Merchants and drivers go through
 * document review, so their list shows the review status and documents and
 * can be filtered by status; farmers don't upload documents, so theirs doesn't.
 */
export default function PartnersPage({ kind }: { kind: PartnerKind }) {
  const reviewed = kind !== 'farmers'
  const [filter, setFilter] = useState<Filter>('all')
  const status: ProfileStatus | undefined = !reviewed || filter === 'all' ? undefined : filter
  const { data, isLoading, isError, error } = usePartnersQuery({ kind, status })
  const copy = COPY[kind]
  const showTypes = kind === 'merchants'
  const showLand = kind === 'farmers'
  const land = showLand && data ? totalLand(data) : undefined

  // Done approves (the documents are correct); ✗ rejects with a reason the
  // merchant or driver sees. localMart-BE lets only these designations decide.
  const me = useMeQuery()
  const canReview = PARTNER_REVIEWERS.includes(me.data?.designation ?? '')
  const [review, { isLoading: saving }] = useReviewPartnerMutation()
  const [rejecting, setRejecting] = useState<Partner | null>(null)

  const decide = async (p: Partner, decision: 'approved' | 'rejected', note?: string) => {
    try {
      await review({ kind, id: p.id, status: decision, note }).unwrap()
      toast.success(decision === 'approved' ? `${p.name}'s documents accepted: approved` : `${p.name} was rejected`)
      setRejecting(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  /** Why a row's action is off, if it is: nothing to check yet, or already decided. */
  const blocked = (p: Partner, decision: 'approved' | 'rejected'): string | undefined =>
    !canReview
      ? `Only the CEO, a Super-Admin or a Manager can review a ${copy.one}`
      : p.documents.length === 0
        ? 'No documents submitted yet'
        : p.profileStatus === decision
          ? `Already ${decision}`
          : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>
          {data ? `${data.length} ${data.length === 1 ? copy.one : copy.many}` : `Every ${copy.one} account`}
          {land && ` · ${land} in total`}
        </CardDescription>
        {reviewed && (
          <CardAction>
            <Select
              items={FILTERS}
              value={filter}
              onValueChange={(value) => {
                const next = FILTERS.find((f) => f.value === value)
                if (next) setFilter(next.value)
              }}
            >
              <SelectTrigger aria-label="Filter by status" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {reviewed && !canReview && me.data && (
          <Alert>
            <Info aria-hidden />
            <AlertDescription>
              Only the CEO, a Super-Admin or a Manager can approve or reject a {copy.one}.
            </AlertDescription>
          </Alert>
        )}
        {isError ? (
          <ErrorNote error={error} />
        ) : isLoading || !data ? (
          <div className="grid gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {copy.many}
            {status ? ` with this status` : ' yet'}.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                {showTypes && <TableHead>Business</TableHead>}
                {showLand && <TableHead>Total area</TableHead>}
                {reviewed && <TableHead>Status</TableHead>}
                {reviewed && <TableHead>Documents</TableHead>}
                {reviewed && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <div className="grid text-sm">
                      {p.email && <span>{p.email}</span>}
                      {p.phoneNumber && <span className="text-muted-foreground">{p.phoneNumber}</span>}
                      {!p.email && !p.phoneNumber && <span className="text-muted-foreground">None given</span>}
                    </div>
                  </TableCell>
                  {showLand && (
                    <TableCell className="tabular-nums">
                      {p.landSize !== undefined && p.landUnit ? (
                        formatArea(p.landSize, p.landUnit)
                      ) : (
                        <span className="text-muted-foreground">Not given</span>
                      )}
                    </TableCell>
                  )}
                  {showTypes && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.businessTypes ?? []).map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {reviewed && (
                    <TableCell>
                      <div className="grid gap-1">
                        <StatusBadge status={p.profileStatus} />
                        {p.reviewNote && (
                          <span className="max-w-56 text-xs text-muted-foreground">{p.reviewNote}</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {reviewed && (
                    <TableCell>
                      {p.documents.length === 0 ? (
                        <span className="text-sm text-muted-foreground">None</span>
                      ) : (
                        <div className="grid gap-1">
                          {p.documents.map((d) => (
                            <DocumentLink key={d.url} kind={d.kind} url={d.url} />
                          ))}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {reviewed && (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {/* A disabled button shows no tooltip, so its wrapper carries the reason. */}
                        <span title={blocked(p, 'approved')}>
                          <Button
                            size="sm"
                            disabled={saving || blocked(p, 'approved') !== undefined}
                            onClick={() => decide(p, 'approved')}
                          >
                            <Check aria-hidden />
                            Done
                          </Button>
                        </span>
                        <span title={blocked(p, 'rejected')}>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            aria-label={`Reject ${p.name}`}
                            disabled={saving || blocked(p, 'rejected') !== undefined}
                            onClick={() => setRejecting(p)}
                          >
                            <X aria-hidden />
                          </Button>
                        </span>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <RejectDialog
          key={rejecting?.id ?? 'none'}
          subject={rejecting?.name ?? null}
          audience={`The ${copy.one}`}
          busy={saving}
          onCancel={() => setRejecting(null)}
          onConfirm={(note) => rejecting && decide(rejecting, 'rejected', note)}
        />
      </CardContent>
    </Card>
  )
}
