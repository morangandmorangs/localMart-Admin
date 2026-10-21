import { PROFILE_STATUSES, type ProfileStatus } from '@/api/partners-api'
import { Badge } from '@/components/ui/badge'

const VARIANT: Record<ProfileStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  approved: 'default',
  // Not 'secondary': that is the cards' own grey, and the badge would vanish.
  'under-review': 'outline',
  'pending-documents': 'outline',
  rejected: 'destructive',
  suspended: 'destructive',
}

/** A partner's profile status, always as words. */
export default function StatusBadge({ status }: { status: ProfileStatus }) {
  const label = PROFILE_STATUSES.find((s) => s.value === status)?.label ?? status
  return <Badge variant={VARIANT[status] ?? 'outline'}>{label}</Badge>
}
