/** Shared domain types for drift simulation (filled in by later tickets). */

export type LonLat = {
  lon: number
  lat: number
}

export type HorizonHours = 24 | 48 | 72

export type EpisodeRef = {
  id: string
  productId: string
  datasetId: string
  regionLabel: string
}
