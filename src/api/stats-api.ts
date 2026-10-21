import { adminApi, type Envelope } from './base-api'

/** GET /api/admin/stats/customers */
export interface CustomerStats {
  total: number
  newThisWeek: number
  newLastWeek: number
  /** Week-on-week change in sign-ups, in percent; null when last week had none. */
  weeklyGrowthPercent: number | null
  /** Customers who signed in during the last 24 hours. */
  activeToday: number
}

/** GET /api/admin/stats/peak-hours */
export interface PeakHours {
  /** 24 entries, hour 0 to 23. */
  hours: { hour: number; count: number }[]
  peakHour: number | null
  windowDays: number
  timeZone: string
}

export const statsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    customerStats: build.query<CustomerStats, void>({
      query: () => '/admin/stats/customers',
      transformResponse: (reply: Envelope<CustomerStats>) => reply.data,
    }),
    peakHours: build.query<PeakHours, void>({
      query: () => '/admin/stats/peak-hours',
      transformResponse: (reply: Envelope<PeakHours>) => reply.data,
    }),
  }),
})

export const { useCustomerStatsQuery, usePeakHoursQuery } = statsApi
