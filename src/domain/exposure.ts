import type { DriftRunResult } from './driftEngine.ts'
import { distanceToPolygonM, pointInPolygon, type LonLat } from './geoSpatial.ts'

export type ZoneKind = 'coast_watch' | 'protected_like'

export type ExposureZone = {
  id: string
  name: string
  kind: ZoneKind
  /** Soft proximity threshold used for "near" classification (km). */
  proximityKm: number
  geometry: GeoJSON.Polygon
}

export type ContactClass = 'inside' | 'near' | 'none'

export type ZoneExposure = {
  zoneId: string
  name: string
  kind: ZoneKind
  contact: ContactClass
  /** Distinct particles that entered the polygon at any path sample. */
  particlesInside: number
  /** Distinct particles that came within proximityKm but never inside. */
  particlesNearOnly: number
  /** Minimum distance observed across all samples (km). 0 if any inside. */
  minDistanceKm: number
  /** Sample count inside (for debugging; not a probability). */
  insideSampleCount: number
}

export type ExposureReport = {
  horizonHours: number
  particleCount: number
  zones: ZoneExposure[]
  outOfDomainParticles: number
  disclaimer: string
  provenanceNote: string
}

export const EXPOSURE_DISCLAIMER =
  'Candidate watch ranking from particle presence/proximity only — not arrival time, not calibrated environmental risk, and not official protected-area status.'

/**
 * Score each zone once per particle (no double-count): inside wins over near.
 * Normalization is particle fraction of the run, not of any observation set.
 */
export function scoreExposure(
  result: DriftRunResult,
  zones: ExposureZone[],
  horizonHours: number,
  provenanceNote: string,
): ExposureReport {
  const zoneScores = zones.map((zone) => scoreZone(result, zone))
  zoneScores.sort((a, b) => rankKey(b) - rankKey(a))

  return {
    horizonHours,
    particleCount: result.particles.length,
    zones: zoneScores,
    outOfDomainParticles: result.particles.filter((p) => p.status === 'out_of_bounds')
      .length,
    disclaimer: EXPOSURE_DISCLAIMER,
    provenanceNote,
  }
}

function rankKey(z: ZoneExposure): number {
  const contactWeight = z.contact === 'inside' ? 1_000_000 : z.contact === 'near' ? 100_000 : 0
  return contactWeight + z.particlesInside * 1_000 + z.particlesNearOnly * 10 - z.minDistanceKm
}

function scoreZone(result: DriftRunResult, zone: ExposureZone): ZoneExposure {
  const proximityM = zone.proximityKm * 1000
  let particlesInside = 0
  let particlesNearOnly = 0
  let insideSampleCount = 0
  let minDistanceM = Number.POSITIVE_INFINITY

  for (const particle of result.particles) {
    let sawInside = false
    let sawNear = false
    for (const step of particle.path) {
      const point: LonLat = { lon: step.lon, lat: step.lat }
      const dist = distanceToPolygonM(point, zone.geometry)
      minDistanceM = Math.min(minDistanceM, dist)
      if (pointInPolygon(point, zone.geometry) || dist === 0) {
        sawInside = true
        insideSampleCount += 1
      } else if (dist <= proximityM) {
        sawNear = true
      }
    }
    if (sawInside) {
      particlesInside += 1
    } else if (sawNear) {
      particlesNearOnly += 1
    }
  }

  const contact: ContactClass =
    particlesInside > 0 ? 'inside' : particlesNearOnly > 0 ? 'near' : 'none'

  return {
    zoneId: zone.id,
    name: zone.name,
    kind: zone.kind,
    contact,
    particlesInside,
    particlesNearOnly,
    minDistanceKm:
      minDistanceM === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : minDistanceM / 1000,
    insideSampleCount,
  }
}
