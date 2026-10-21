import { useState } from 'react'
import { Check, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useMeQuery } from '@/api/auth-api'
import { errorMessage } from '@/api/base-api'
import {
  PARTNER_REVIEWERS,
  usePartnersQuery,
  useReviewPartnerMutation,
  type Partner,
  type PartnerKind,
} from '@/api/partners-api'
import { usePendingProposalsQuery, useReviewProposalMutation, type Proposal } from '@/api/products-api'
import DocumentLink from '@/components/DocumentLink'
import ErrorNote from '@/components/ErrorNote'
import RejectDialog from '@/components/RejectDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatRupees } from '@/lib/format'

const Loading = () => (
  <div className="grid gap-2">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
)

const Empty = ({ children }: { children: string }) => (
  <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
)

/** "₹249.50", or "500 g ₹18 · 1 kg ₹35" for a product sold in sizes. */
const priceSummary = (p: Proposal): string =>
  p.variants?.length
    ? p.variants.map((v) => `${v.label} ${formatRupees(v.price)}`).join(' · ')
    : p.price !== undefined
      ? formatRupees(p.price)
      : 'No price'

function ProposalQueue() {
  const { data, isLoading, isError, error } = usePendingProposalsQuery()
  const [review, { isLoading: saving }] = useReviewProposalMutation()
  const [rejecting, setRejecting] = useState<Proposal | null>(null)

  const decide = async (p: Proposal, status: 'approved' | 'rejected', note?: string) => {
    try {
      await review({ productId: p.id, status, note }).unwrap()
      toast.success(status === 'approved' ? `${p.name} is now on sale` : `${p.name} was rejected`)
      setRejecting(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (isError) return <ErrorNote error={error} />
  if (isLoading || !data) return <Loading />
  if (data.proposals.length === 0) return <Empty>No products waiting for review.</Empty>

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Proposed by</TableHead>
            <TableHead>Aisle</TableHead>
            <TableHead>Shop's price</TableHead>
            <TableHead className="text-right">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.proposals.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img src={p.image} alt="" className="size-10 rounded-md border object-cover" />
                  <div className="grid">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.id}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="grid">
                  <span>{p.proposedBy?.name ?? 'Unknown shop'}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{p.category}</Badge>
                <span className="ml-1 text-xs text-muted-foreground">{p.subCategory}</span>
              </TableCell>
              <TableCell className="text-sm">{priceSummary(p)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => setRejecting(p)}>
                    Reject
                  </Button>
                  <Button size="sm" disabled={saving} onClick={() => decide(p, 'approved')}>
                    {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                    Approve
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <RejectDialog
        key={rejecting?.id ?? 'none'}
        subject={rejecting?.name ?? null}
        audience="The merchant"
        busy={saving}
        onCancel={() => setRejecting(null)}
        onConfirm={(note) => rejecting && decide(rejecting, 'rejected', note)}
      />
    </>
  )
}

function PartnerQueue({ kind, canReview }: { kind: PartnerKind; canReview: boolean }) {
  const { data, isLoading, isError, error } = usePartnersQuery({ kind, status: 'under-review' })
  const [review, { isLoading: saving }] = useReviewPartnerMutation()
  const [rejecting, setRejecting] = useState<Partner | null>(null)
  const one = kind === 'merchants' ? 'merchant' : 'driver'

  const decide = async (p: Partner, status: 'approved' | 'rejected', note?: string) => {
    try {
      await review({ kind, id: p.id, status, note }).unwrap()
      toast.success(status === 'approved' ? `${p.name} can start working` : `${p.name} was rejected`)
      setRejecting(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (isError) return <ErrorNote error={error} />
  if (isLoading || !data) return <Loading />

  return (
    <div className="grid gap-4">
      {!canReview && (
        <Alert>
          <Info aria-hidden />
          <AlertDescription>
            Only the CEO, a Super-Admin or a Manager can approve or reject a {one}. You can see the queue.
          </AlertDescription>
        </Alert>
      )}
      {data.length === 0 ? (
        <Empty>{`No ${one}s waiting for review.`}</Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              {kind === 'merchants' && <TableHead>Business</TableHead>}
              <TableHead>Documents</TableHead>
              <TableHead className="text-right">Decision</TableHead>
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
                  </div>
                </TableCell>
                {kind === 'merchants' && (
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
                <TableCell>
                  <div className="grid gap-1">
                    {p.documents.map((d) => (
                      <DocumentLink key={d.url} kind={d.kind} url={d.url} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canReview || saving}
                      onClick={() => setRejecting(p)}
                    >
                      Reject
                    </Button>
                    <Button size="sm" disabled={!canReview || saving} onClick={() => decide(p, 'approved')}>
                      {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                      Approve
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <RejectDialog
        key={rejecting?.id ?? 'none'}
        subject={rejecting?.name ?? null}
        audience={`The ${one}`}
        busy={saving}
        onCancel={() => setRejecting(null)}
        onConfirm={(note) => rejecting && decide(rejecting, 'rejected', note)}
      />
    </div>
  )
}

/** Everything waiting on an admin: products merchants proposed, and new merchants and drivers. */
export default function ApprovalsPage() {
  const me = useMeQuery()
  const canReviewPartners = PARTNER_REVIEWERS.includes(me.data?.designation ?? '')
  const proposals = usePendingProposalsQuery()
  const merchants = usePartnersQuery({ kind: 'merchants', status: 'under-review' })
  const drivers = usePartnersQuery({ kind: 'drivers', status: 'under-review' })

  const count = (n: number | undefined) => (n ? ` (${n})` : '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
        <CardDescription>Approve to put a product on sale or let a partner start working.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products{count(proposals.data?.proposals.length)}</TabsTrigger>
            <TabsTrigger value="merchants">Merchants{count(merchants.data?.length)}</TabsTrigger>
            <TabsTrigger value="drivers">Drivers{count(drivers.data?.length)}</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="pt-4">
            <ProposalQueue />
          </TabsContent>
          <TabsContent value="merchants" className="pt-4">
            <PartnerQueue kind="merchants" canReview={canReviewPartners} />
          </TabsContent>
          <TabsContent value="drivers" className="pt-4">
            <PartnerQueue kind="drivers" canReview={canReviewPartners} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
