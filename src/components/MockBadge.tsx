import { Badge } from '@/components/ui/badge'

/** Marks a figure that is placeholder data, not read from localMart-BE. Render it only while the data is mock. */
export default function MockBadge() {
  return (
    <Badge variant="outline" title="Placeholder numbers, not real data yet">
      Mock
    </Badge>
  )
}
