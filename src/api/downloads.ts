/** Customer app installs per store. */
export interface AppDownloads {
  android: number
  ios: number
  /** True while the numbers are placeholders, so the UI can say so. */
  isMock: boolean
}

/**
 * Placeholder numbers. Install counts live in Google Play Console and App
 * Store Connect, which localMart-BE doesn't read yet. When it does, make this
 * an RTK Query endpoint in stats-api.ts that returns the same shape with
 * `isMock: false`, and the card needs no change.
 */
const MOCK_DOWNLOADS: AppDownloads = { android: 12480, ios: 4215, isMock: true }

export const useAppDownloads = (): AppDownloads => MOCK_DOWNLOADS
