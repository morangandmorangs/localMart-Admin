import { adminApi, type Envelope, type PageMeta } from './base-api'

export const CULTIVATION_STAGES = [
  { value: 'growing', label: 'Growing' },
  { value: 'ready', label: 'Ready to harvest' },
  { value: 'harvested', label: 'Harvested' },
] as const

export type CultivationStage = (typeof CULTIVATION_STAGES)[number]['value']

/** One crop a farmer recorded (GET /api/farmers/crops). */
export interface CultivationRecord {
  id: string
  crop: string
  cropLabel: string
  variety?: string
  /** Land under this crop, in `landUnit`. */
  area?: number
  landUnit: string
  /** Calendar dates (midnight UTC). */
  plantedOn: string
  expectedHarvestOn: string
  harvestedOn?: string
  stage: CultivationStage
  /** Days until the expected harvest; 0 or less once due. Absent once harvested. */
  daysToHarvest?: number
  farmer: { id: string; name: string; phoneNumber?: string; place?: string }
}

/** A crop farmers can record (GET /api/farmers/crop-catalog). */
export interface CropOption {
  slug: string
  label: string
  days: number
}

export interface CultivationFilter {
  stage?: CultivationStage
  crop?: string
  /** Farmer's name, village or district. */
  search?: string
  page: number
}

type CultivationMeta = PageMeta & { stages: Record<CultivationStage, number> }

export const cultivationApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    cultivation: build.query<{ records: CultivationRecord[]; meta: CultivationMeta }, CultivationFilter>({
      query: ({ stage, crop, search, page }) => ({
        url: '/farmers/crops',
        params: {
          page,
          limit: 50,
          ...(stage ? { stage } : {}),
          ...(crop ? { crop } : {}),
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (reply: Envelope<CultivationRecord[]> & { meta: CultivationMeta }) => ({
        records: reply.data,
        meta: reply.meta,
      }),
    }),
    cropCatalog: build.query<CropOption[], void>({
      query: () => '/farmers/crop-catalog',
      transformResponse: (reply: Envelope<CropOption[]>) => reply.data,
    }),
  }),
})

export const { useCultivationQuery, useCropCatalogQuery } = cultivationApi
