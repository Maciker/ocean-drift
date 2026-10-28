import type { DriftRunRequest, DriftRunResult } from './driftEngine.ts'
import { METERS_PER_DEG_LAT, metersPerDegLon } from './geo.ts'
import { DEMO_PARTICLE_COUNT } from './playback.ts'

/** Hard cap so dual runs stay interactive in the browser. */
export const MAX_COMPARE_SCENARIOS = 2
export const COMPARE_PARTICLE_COUNT = Math.min(DEMO_PARTICLE_COUNT, 24)

export type CompareMode = 'off' | 'origin_offset' | 'start_offset' | 'dispersion'

export type ScenarioSpec = {
  id: 'base' | 'variant'
  label: string
  /** Short legend colour hint for UI (CSS class suffix). */
  colorKey: 'base' | 'variant'
  request: DriftRunRequest
}

export type CompareSummary = {
  mode: Exclude<CompareMode, 'off'>
  disclaimer: string
  baseEndpoint: { lon: number; lat: number }
  variantEndpoint: { lon: number; lat: number }
  /** Great-circle-ish planar distance between mean endpoints (meters). */
  endpointSeparationM: number
  baseActiveCount: number
  variantActiveCount: number
}

export const SENSITIVITY_DISCLAIMER =
  'Sensitivity exploration only — scenario/particle frequencies are not calibrated impact probabilities.'

const ORIGIN_OFFSET_DEG = 0.08
const START_OFFSET_HOURS = 6
const VARIANT_DISPERSION_MPS = 0.05

/**
 * Build base + one bounded variant sharing the same dataset, engine knobs,
 * and seed family so the comparison is reproducible.
 */
export function buildCompareScenarios(
  base: DriftRunRequest,
  mode: Exclude<CompareMode, 'off'>,
): ScenarioSpec[] {
  const shared: DriftRunRequest = {
    ...base,
    particleCount: Math.min(base.particleCount, COMPARE_PARTICLE_COUNT),
  }

  const baseSpec: ScenarioSpec = {
    id: 'base',
    label: 'Base',
    colorKey: 'base',
    request: { ...shared, seed: shared.seed },
  }

  let variant: ScenarioSpec
  switch (mode) {
    case 'origin_offset':
      variant = {
        id: 'variant',
        label: `Origin +${ORIGIN_OFFSET_DEG}°E`,
        colorKey: 'variant',
        request: {
          ...shared,
          origin: {
            lon: shared.origin.lon + ORIGIN_OFFSET_DEG,
            lat: shared.origin.lat,
          },
          seed: shared.seed + 1,
        },
      }
      break
    case 'start_offset':
      variant = {
        id: 'variant',
        label: `Start +${START_OFFSET_HOURS} h`,
        colorKey: 'variant',
        request: {
          ...shared,
          startUtc: shiftUtcHours(shared.startUtc, START_OFFSET_HOURS),
          seed: shared.seed + 1,
        },
      }
      break
    case 'dispersion':
      variant = {
        id: 'variant',
        label: `Dispersion ${VARIANT_DISPERSION_MPS} m/s`,
        colorKey: 'variant',
        request: {
          ...shared,
          dispersionMps: VARIANT_DISPERSION_MPS,
          seed: shared.seed + 1,
        },
      }
      break
  }

  return [baseSpec, variant].slice(0, MAX_COMPARE_SCENARIOS)
}

export function meanEndpoint(result: DriftRunResult): { lon: number; lat: number } {
  const points = result.particles.map((p) => {
    const last = p.path[p.path.length - 1]
    return { lon: last?.lon ?? p.lon, lat: last?.lat ?? p.lat }
  })
  if (points.length === 0) {
    return { lon: 0, lat: 0 }
  }
  const lon = points.reduce((sum, p) => sum + p.lon, 0) / points.length
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  return { lon, lat }
}

export function planarSeparationM(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): number {
  const midLat = (a.lat + b.lat) / 2
  const east = (b.lon - a.lon) * metersPerDegLon(midLat)
  const north = (b.lat - a.lat) * METERS_PER_DEG_LAT
  return Math.hypot(east, north)
}

export function summarizeCompare(
  mode: Exclude<CompareMode, 'off'>,
  base: DriftRunResult,
  variant: DriftRunResult,
): CompareSummary {
  const baseEndpoint = meanEndpoint(base)
  const variantEndpoint = meanEndpoint(variant)
  return {
    mode,
    disclaimer: SENSITIVITY_DISCLAIMER,
    baseEndpoint,
    variantEndpoint,
    endpointSeparationM: planarSeparationM(baseEndpoint, variantEndpoint),
    baseActiveCount: countNotStranded(base),
    variantActiveCount: countNotStranded(variant),
  }
}

function countNotStranded(result: DriftRunResult): number {
  return result.particles.filter((p) => p.status !== 'stranded_land').length
}

function shiftUtcHours(iso: string, hours: number): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) {
    return iso
  }
  return new Date(ms + hours * 3600_000).toISOString()
}
