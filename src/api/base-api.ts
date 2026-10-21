import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'

import { selectToken, signedOut } from '@/store/auth-slice'
import type { RootState } from '@/store/store'

/** localMart-BE's success reply. Lists add `meta` (page, limit, total, totalPages). */
export interface Envelope<T> {
  success: true
  data: T
  message?: string
  meta?: PageMeta
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** A failed call, as every hook and `.unwrap()` reports it. */
export interface ApiError {
  status: FetchBaseQueryError['status']
  message: string
  /** localMart-BE's error code, e.g. VALIDATION_FAILED, TOKEN_EXPIRED. */
  code?: string
  /** Quote this when reporting a server error: it finds the request in the logs. */
  requestId?: string
}

export const isApiError = (value: unknown): value is ApiError =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof value.message === 'string'

/** A string field of an error body, which is the server's and unchecked. */
const field = (body: unknown, key: string): string | undefined => {
  const value: unknown =
    typeof body === 'object' && body !== null ? Reflect.get(body, key) : undefined
  return typeof value === 'string' ? value : undefined
}

const rawBaseQuery = fetchBaseQuery({
  // Same origin: Vite proxies /api to the gateway in dev.
  baseUrl: import.meta.env.VITE_API_URL ?? '/api',
  prepareHeaders: (headers, { getState }) => {
    // RTK Query passes the store's state untyped; it is this app's own store.
    const token = selectToken(getState() as RootState)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

/**
 * Calls localMart-BE and turns its error envelope
 * (`{ success: false, message, code, requestId }`) into an ApiError. A 401
 * while signed in means the token expired or the account was disabled, so
 * the admin is signed out.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (!result.error) return { data: result.data, meta: result.meta }

  const { status } = result.error
  const body = 'data' in result.error ? result.error.data : undefined
  if (status === 401 && selectToken(api.getState() as RootState)) {
    api.dispatch(signedOut())
  }

  const code = field(body, 'code')
  const requestId = field(body, 'requestId')
  return {
    error: {
      status,
      message:
        field(body, 'message') ??
        (status === 'FETCH_ERROR'
          ? "Can't reach localMart-BE. Is the gateway running?"
          : `Request failed (${status})`),
      ...(code ? { code } : {}),
      ...(requestId ? { requestId } : {}),
    },
  }
}

/**
 * The one RTK Query API for localMart-BE. Feature files add their endpoints
 * with `adminApi.injectEndpoints`, so this file stays small.
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['Me', 'Catalog', 'Proposals', 'Partners'],
  endpoints: () => ({}),
})

/** What to tell the admin when a call failed. */
export const errorMessage = (error: unknown): string =>
  isApiError(error) ? error.message : 'Something went wrong. Try again.'
