/**
 * The URL if it is a plain web address, else undefined. Partner documents are
 * URLs the partner submitted; rendering one as a link must never run script
 * (`javascript:`) in the admin's signed-in page.
 */
export const safeHttpUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}
