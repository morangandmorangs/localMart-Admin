import { adminApi, type Envelope } from './base-api'

export type AdminDesignation = 'CEO' | 'Super-Admin' | 'Manager' | 'Developer'

/** GET /api/admin/auth/me */
export interface AdminProfile {
  id: string
  name: string
  email: string
  role: string
  designation: AdminDesignation
  isActive?: boolean
}

export interface Credentials {
  email: string
  password: string
}

type Session = AdminProfile & { token: string }

export const authApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, Credentials>({
      query: (body) => ({ url: '/admin/auth/login', method: 'POST', body }),
      transformResponse: (reply: Envelope<Session>) => reply.data,
    }),
    me: build.query<AdminProfile, void>({
      query: () => '/admin/auth/me',
      transformResponse: (reply: Envelope<AdminProfile>) => reply.data,
      providesTags: ['Me'],
    }),
  }),
})

export const { useLoginMutation, useMeQuery } = authApi
