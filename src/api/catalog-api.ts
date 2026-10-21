import { adminApi, type Envelope } from './base-api'

/** GET /api/catalog/status */
export interface CatalogStatus {
  /** `preview` until any seller has stock; then `live`. */
  mode: 'preview' | 'live'
  showStock: boolean
  total: number
  available: number
  unavailable: number
}

export const catalogApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    catalogStatus: build.query<CatalogStatus, void>({
      query: () => '/catalog/status',
      transformResponse: (reply: Envelope<CatalogStatus>) => reply.data,
      providesTags: ['Catalog'],
    }),
    /** How many merchant proposals wait for review (asks for one row, reads the total). */
    pendingProposalCount: build.query<number, void>({
      query: () => ({ url: '/products/admin/proposals', params: { status: 'pending', limit: 1 } }),
      transformResponse: (reply: Envelope<unknown[]>) => reply.meta?.total ?? reply.data.length,
      providesTags: ['Proposals'],
    }),
  }),
})

export const { useCatalogStatusQuery, usePendingProposalCountQuery } = catalogApi
