import { FileText } from 'lucide-react'

import { safeHttpUrl } from '@/lib/url'

/** A partner's submitted document, opened in a new tab. Anything but a web address is shown, not linked. */
export default function DocumentLink({ kind, url }: { kind: string; url: string }) {
  const href = safeHttpUrl(url)
  if (!href) {
    return <span className="text-sm text-destructive">{kind} (not a web link)</span>
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-sm text-link underline-offset-4 hover:underline"
    >
      <FileText className="size-3.5" aria-hidden />
      {kind}
    </a>
  )
}
