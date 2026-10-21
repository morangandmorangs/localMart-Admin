import { adminApi, type Envelope } from './base-api'

/** Merchants, drivers and farmers share one API shape: /api/merchants, /api/drivers and /api/farmers. */
export type PartnerKind = 'merchants' | 'drivers' | 'farmers'

export const PROFILE_STATUSES = [
  { value: 'under-review', label: 'Under review' },
  { value: 'pending-documents', label: 'Waiting for documents' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
] as const

export type ProfileStatus = (typeof PROFILE_STATUSES)[number]['value']

export interface PartnerDocument {
  kind: string
  url: string
  submittedAt: string
}

/** A merchant, driver or farmer as the admin list returns them. */
export interface Partner {
  id: string
  name: string
  email?: string
  phoneNumber?: string
  provider: string
  profileStatus: ProfileStatus
  documents: PartnerDocument[]
  reviewNote?: string
  canOperate: boolean
  /** Merchants only. */
  businessTypes?: string[]
  /** Farmers only: total land, in `landUnit`. Absent until the farmer enters it. */
  landSize?: number
  landUnit?: string
}

/** Admin designations localMart-BE lets approve or reject a merchant or driver. */
export const PARTNER_REVIEWERS: readonly string[] = ['CEO', 'Super-Admin', 'Manager']

export interface PartnerReview {
  kind: PartnerKind
  id: string
  status: 'approved' | 'rejected'
  /** Required when not approving: the partner sees it. */
  note?: string
}

export const partnersApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    partners: build.query<Partner[], { kind: PartnerKind; status?: ProfileStatus }>({
      query: ({ kind, status }) => ({ url: `/${kind}`, params: status ? { status } : undefined }),
      transformResponse: (reply: Envelope<Partner[]>) => reply.data,
      providesTags: (_result, _error, { kind }) => [{ type: 'Partners', id: kind }],
    }),
    reviewPartner: build.mutation<Partner, PartnerReview>({
      query: ({ kind, id, ...body }) => ({
        url: `/${kind}/${encodeURIComponent(id)}/review`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (reply: Envelope<Partner>) => reply.data,
      invalidatesTags: (_result, _error, { kind }) => [{ type: 'Partners', id: kind }],
    }),
  }),
})

export const { usePartnersQuery, useReviewPartnerMutation } = partnersApi
