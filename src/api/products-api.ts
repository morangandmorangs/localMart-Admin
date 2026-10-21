import { adminApi, type Envelope, type PageMeta } from './base-api'

export const CATEGORIES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'livestock-vegetables', label: 'Fresh (vegetables, meat, fish)' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'food', label: 'Food' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']

/** One size of a product sold by weight or count. */
export interface SizeInput {
  id: string
  label: string
  price: number
  stockCount: number
}

/**
 * POST /api/products. A product has either a fixed price (and stock), or
 * sizes each with their own; never both.
 */
export interface NewProduct {
  /** Usually left out: localMart-BE then gives the product a unique id. */
  productId?: string
  name: string
  image: string
  category: Category
  subCategory: string
  pack?: string
  origin?: string
  useFor?: string
  requiresPrescription?: boolean
  price?: number
  stockCount?: number
  variants?: SizeInput[]
}

export interface Seller {
  sellerId: string | null
  name: string
  price?: number
  stockCount?: number
  variants?: { id: string; label: string; price: number; stockCount: number }[]
}

/** A product as GET /api/products returns it (the fields this app reads). */
export interface Product {
  id: string
  name: string
  image: string
  category: string
  subCategory: string
  pack?: string
  origin?: string
  useFor?: string
  requiresPrescription?: boolean
  price?: number
  stockCount?: number
  variants?: { id: string; label: string; price: number; stockCount: number }[]
  totalStock: number
  sellers: Seller[]
}

/** A product a merchant proposed (GET /api/products/admin/proposals). */
export interface Proposal extends Product {
  approvalStatus: 'pending' | 'approved' | 'rejected'
  reviewNote?: string
  proposedBy?: { id: string; name: string }
  createdAt: string
}

/** One hosted image, as POST /api/products/images returns it. */
export interface UploadedImage {
  url: string
  publicId: string
}

/** GET /api/products: the catalogue a page at a time (the server caps `limit` at 100). */
export interface ProductListArgs {
  limit?: number
  category?: Category
}

export interface ReviewDecision {
  productId: string
  status: 'approved' | 'rejected'
  /** Required for a rejection: the merchant sees it. */
  note?: string
}

export const productsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    catalogProducts: build.query<{ products: Product[]; meta?: PageMeta }, ProductListArgs | void>({
      query: (args) => ({ url: '/products', params: { limit: 24, ...args } }),
      transformResponse: (reply: Envelope<Product[]>) => ({ products: reply.data, meta: reply.meta }),
      providesTags: ['Catalog'],
    }),
    createProduct: build.mutation<Product, NewProduct>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: (reply: Envelope<Product>) => reply.data,
      invalidatesTags: ['Catalog'],
    }),
    /** Hosts images on Cloudinary; the returned `url` goes in a product's `image`. */
    uploadProductImages: build.mutation<UploadedImage[], File[]>({
      query: (files) => {
        const body = new FormData()
        for (const file of files) body.append('images', file)
        return { url: '/products/images', method: 'POST', body }
      },
      transformResponse: (reply: Envelope<UploadedImage[]>) => reply.data,
    }),
    pendingProposals: build.query<{ proposals: Proposal[]; meta?: PageMeta }, void>({
      query: () => ({ url: '/products/admin/proposals', params: { status: 'pending' } }),
      transformResponse: (reply: Envelope<Proposal[]>) => ({ proposals: reply.data, meta: reply.meta }),
      providesTags: ['Proposals'],
    }),
    reviewProposal: build.mutation<Proposal, ReviewDecision>({
      query: ({ productId, ...body }) => ({
        url: `/products/${encodeURIComponent(productId)}/approval`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (reply: Envelope<Proposal>) => reply.data,
      invalidatesTags: ['Proposals', 'Catalog'],
    }),
  }),
})

export const {
  useCatalogProductsQuery,
  useCreateProductMutation,
  usePendingProposalsQuery,
  useReviewProposalMutation,
  useUploadProductImagesMutation,
} = productsApi
