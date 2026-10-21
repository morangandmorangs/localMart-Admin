/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where localMart-BE's /api lives. Defaults to `/api` on this origin (the Vite proxy in dev). */
  readonly VITE_API_URL?: string
}
