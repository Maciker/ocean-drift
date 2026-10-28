import type { LonLat } from './types.ts'

/** Compact surface-current cube consumed by the drift worker. */
export type CurrentField = {
  /** ISO-8601 UTC timestamps, one per time index. */
  timesUtc: string[]
  /** Longitude axis (degrees east), ascending. */
  lon: number[]
  /** Latitude axis (degrees north), ascending. */
  lat: number[]
  /**
   * Eastward velocity (m/s), row-major `[t][lat][lon]`.
   * `null` marks land / missing.
   */
  u: Array<Array<Array<number | null>>>
  /** Northward velocity (m/s), same layout as `u`. */
  v: Array<Array<Array<number | null>>>
}

export type EpisodeKind = 'synthetic' | 'real'

export type EpisodeManifest = {
  id: string
  kind: EpisodeKind
  productId: string
  datasetId: string
  regionLabel: string
  bbox: {
    west: number
    east: number
    south: number
    north: number
  }
  startUtc: string
  endUtc: string
  stepHours: number
  depthLabel: string
  units: 'm/s'
  uvConvention: 'oceanographic-east-north'
  landMask: 'null-velocity'
  citation: string
  sourceCommitNote: string
  currentsFile: string
  /** SHA-256 of currents JSON bytes (utf8), hex. Empty until file exists. */
  currentsSha256: string
  sizeBytes: number
}

export type EpisodeBundle = {
  manifest: EpisodeManifest
  field: CurrentField
}

export function samplePoint(field: CurrentField, tIndex: number, point: LonLat): {
  u: number | null
  v: number | null
} {
  const lonIndex = nearestIndex(field.lon, point.lon)
  const latIndex = nearestIndex(field.lat, point.lat)
  const uPlane = field.u[tIndex]
  const vPlane = field.v[tIndex]
  if (!uPlane || !vPlane) {
    return { u: null, v: null }
  }
  const uRow = uPlane[latIndex]
  const vRow = vPlane[latIndex]
  return {
    u: uRow?.[lonIndex] ?? null,
    v: vRow?.[lonIndex] ?? null,
  }
}

function nearestIndex(axis: number[], value: number): number {
  if (axis.length === 0) {
    return 0
  }
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < axis.length; i += 1) {
    const sample = axis[i]
    if (sample === undefined) {
      continue
    }
    const dist = Math.abs(sample - value)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}
