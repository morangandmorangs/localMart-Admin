import { AlertCircle } from 'lucide-react'

import { isApiError } from '@/api/base-api'
import { Alert, AlertDescription } from '@/components/ui/alert'

/** A failed request's message: the server's when it sent one. */
export default function ErrorNote({ error }: { error: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertDescription>{isApiError(error) ? error.message : 'Could not load this.'}</AlertDescription>
    </Alert>
  )
}
