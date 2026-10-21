import { useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RejectDialogProps {
  /** What is being rejected, for the title: "Reject Fresh Ghee?" */
  subject: string | null
  /** Who reads the reason, for the hint. */
  audience: string
  busy: boolean
  onCancel: () => void
  onConfirm: (note: string) => void
}

/**
 * Asks for the reason before a rejection: the merchant or driver sees it.
 * Give it a `key` per item, so each rejection starts with an empty reason.
 */
export default function RejectDialog({ subject, audience, busy, onCancel, onConfirm }: RejectDialogProps) {
  const [note, setNote] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (note.trim()) onConfirm(note.trim())
  }

  return (
    <Dialog open={subject !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Reject {subject}?</DialogTitle>
            <DialogDescription>{audience} will see this reason, so say what to fix.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-note">Reason</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={busy || !note.trim()}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <X aria-hidden />}
              Reject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
