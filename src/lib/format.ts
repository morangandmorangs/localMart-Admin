const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

/** "₹249.50". Amounts from localMart-BE are rupees. */
export const formatRupees = (amount: number): string => rupees.format(amount)

const DAY_MONTH_YEAR = { day: '2-digit', month: '2-digit', year: 'numeric' } as const

const localDay = new Intl.DateTimeFormat('en-IN', DAY_MONTH_YEAR)

/** "20/10/2026": the day a moment fell on (a timestamp, e.g. when it was created), in local time. */
export const formatDate = (iso: string): string => localDay.format(new Date(iso))

// Calendar dates (planted on, harvest by) are stored as midnight UTC. Read in
// UTC, so a browser west of UTC doesn't show the day before.
const calendarDay = new Intl.DateTimeFormat('en-IN', { ...DAY_MONTH_YEAR, timeZone: 'UTC' })

/** "18/10/2026": a calendar date, day/month/year. */
export const formatDay = (iso: string): string => calendarDay.format(new Date(iso))

const area = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

/** "9 acre", "2.5 hectare". */
export const formatArea = (size: number, unit: string): string => `${area.format(size)} ${unit}`
