import type { DriftRunResult, ParticleState } from './driftEngine.ts'

export type HorizonHours = 24 | 48 | 72

/** Default particle budget for the interactive demo (MAC-364). */
export const DEMO_PARTICLE_COUNT = 36

export type ScrubFrame = {
  index: number
  timeUtc: string
  positions: Array<{ id: number; lon: number; lat: number; status: ParticleState['status'] }>
}

/**
 * Build a shared UTC timeline from the longest particle path.
 * Paths are assumed to share the same time stamps while active.
 */
export function buildTimeline(result: DriftRunResult): string[] {
  let longest: string[] = []
  for (const particle of result.particles) {
    const times = particle.path.map((p) => p.timeUtc)
    if (times.length > longest.length) {
      longest = times
    }
  }
  return longest
}

export function frameAtIndex(result: DriftRunResult, index: number): ScrubFrame {
  const timeline = buildTimeline(result)
  const clamped = Math.max(0, Math.min(index, Math.max(timeline.length - 1, 0)))
  const timeUtc = timeline[clamped] ?? result.particles[0]?.path[0]?.timeUtc ?? ''
  const targetMs = Date.parse(timeUtc)

  const positions = result.particles.map((particle) => {
    let point = particle.path[0]
    for (const step of particle.path) {
      if (Date.parse(step.timeUtc) <= targetMs) {
        point = step
      } else {
        break
      }
    }
    return {
      id: particle.id,
      lon: point?.lon ?? particle.lon,
      lat: point?.lat ?? particle.lat,
      status: particle.status,
    }
  })

  return { index: clamped, timeUtc, positions }
}

export function trailsGeoJson(
  result: DriftRunResult,
  upToIndex: number,
): GeoJSON.FeatureCollection {
  const timeline = buildTimeline(result)
  const cut = timeline[Math.min(upToIndex, timeline.length - 1)]
  const cutMs = cut ? Date.parse(cut) : Number.POSITIVE_INFINITY

  const features: GeoJSON.Feature[] = result.particles.map((particle) => {
    const coords = particle.path
      .filter((p) => Date.parse(p.timeUtc) <= cutMs)
      .map((p) => [p.lon, p.lat] as [number, number])
    return {
      type: 'Feature',
      properties: { id: particle.id, status: particle.status },
      geometry: {
        type: 'LineString',
        coordinates: coords.length >= 2 ? coords : coords.length === 1 ? [coords[0]!, coords[0]!] : [],
      },
    }
  })

  return { type: 'FeatureCollection', features }
}

export function particlesGeoJson(frame: ScrubFrame): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: frame.positions.map((p) => ({
      type: 'Feature',
      properties: { id: p.id, status: p.status },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    })),
  }
}

export function originGeoJson(origin: { lon: number; lat: number } | null): GeoJSON.FeatureCollection {
  if (!origin) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { role: 'origin' },
        geometry: { type: 'Point', coordinates: [origin.lon, origin.lat] },
      },
    ],
  }
}
