import type { CurrentField, EpisodeManifest } from './currentField.ts'
import { displaceLonLat } from './geo.ts'
import { sampleVelocity } from './interpolate.ts'
import { createMulberry32 } from './rng.ts'

export const DRIFT_ENGINE_VERSION = '0.1.0'

export type Integrator = 'euler' | 'rk2'

export type ParticleStatus = 'active' | 'stranded_land' | 'out_of_bounds' | 'ended_time'

export type ParticleState = {
  id: number
  lon: number
  lat: number
  status: ParticleStatus
  path: Array<{ lon: number; lat: number; timeUtc: string }>
}

export type DriftRunRequest = {
  field: CurrentField
  manifest: EpisodeManifest
  origin: { lon: number; lat: number }
  startUtc: string
  horizonHours: number
  particleCount: number
  dtSeconds: number
  integrator: Integrator
  seed: number
  /** Optional isotropic random-walk speed (m/s). 0 = pure advection. */
  dispersionMps: number
}

export type DriftRunResult = {
  engineVersion: string
  datasetId: string
  datasetHash: string
  seed: number
  integrator: Integrator
  dtSeconds: number
  dispersionMps: number
  particles: ParticleState[]
}

function requireFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${label}`)
  }
}

function validateRequest(request: DriftRunRequest): void {
  requireFinite('origin.lon', request.origin.lon)
  requireFinite('origin.lat', request.origin.lat)
  if (request.particleCount < 1) throw new Error('particleCount must be >= 1')
  if (request.dtSeconds <= 0) throw new Error('dtSeconds must be > 0')
  if (request.horizonHours <= 0) throw new Error('horizonHours must be > 0')
  if (request.dispersionMps < 0) throw new Error('dispersionMps must be >= 0')
  if (request.field.timesUtc.length < 2) throw new Error('field needs at least two time steps')
  const startMs = Date.parse(request.startUtc)
  if (Number.isNaN(startMs)) throw new Error('Invalid startUtc')
}

function stepVelocity(
  field: CurrentField,
  lon: number,
  lat: number,
  timeMs: number,
  integrator: Integrator,
  dtSeconds: number,
): { ok: true; lon: number; lat: number } | { ok: false; status: ParticleStatus } {
  const s0 = sampleVelocity(field, lon, lat, timeMs)
  if (!s0.ok) {
    return {
      ok: false,
      status: s0.reason === 'missing' ? 'stranded_land' : s0.reason === 'out_of_bounds' ? 'out_of_bounds' : 'ended_time',
    }
  }

  if (integrator === 'euler') {
    const next = displaceLonLat(lon, lat, s0.u * dtSeconds, s0.v * dtSeconds)
    return { ok: true, ...next }
  }

  // Midpoint (RK2)
  const mid = displaceLonLat(lon, lat, s0.u * (dtSeconds / 2), s0.v * (dtSeconds / 2))
  const s1 = sampleVelocity(field, mid.lon, mid.lat, timeMs + (dtSeconds / 2) * 1000)
  if (!s1.ok) {
    return {
      ok: false,
      status: s1.reason === 'missing' ? 'stranded_land' : s1.reason === 'out_of_bounds' ? 'out_of_bounds' : 'ended_time',
    }
  }
  const next = displaceLonLat(lon, lat, s1.u * dtSeconds, s1.v * dtSeconds)
  return { ok: true, ...next }
}

export function runDrift(request: DriftRunRequest): DriftRunResult {
  validateRequest(request)
  const { field, manifest } = request
  const startMs = Date.parse(request.startUtc)
  const endMs = startMs + request.horizonHours * 3600_000
  const fieldEnd = Date.parse(field.timesUtc[field.timesUtc.length - 1] ?? '')
  const stopMs = Math.min(endMs, fieldEnd)
  const rand = createMulberry32(request.seed)

  const particles: ParticleState[] = []
  for (let i = 0; i < request.particleCount; i += 1) {
    particles.push({
      id: i,
      lon: request.origin.lon,
      lat: request.origin.lat,
      status: 'active',
      path: [{ lon: request.origin.lon, lat: request.origin.lat, timeUtc: request.startUtc }],
    })
  }

  for (const particle of particles) {
    let timeMs = startMs
    while (particle.status === 'active' && timeMs < stopMs) {
      const nextTime = Math.min(timeMs + request.dtSeconds * 1000, stopMs)
      const dt = (nextTime - timeMs) / 1000
      if (dt <= 0) break

      const stepped = stepVelocity(
        field,
        particle.lon,
        particle.lat,
        timeMs,
        request.integrator,
        dt,
      )
      if (!stepped.ok) {
        particle.status = stepped.status
        break
      }

      let { lon, lat } = stepped
      if (request.dispersionMps > 0) {
        const angle = rand() * Math.PI * 2
        const speed = request.dispersionMps * rand()
        const moved = displaceLonLat(
          lon,
          lat,
          Math.cos(angle) * speed * dt,
          Math.sin(angle) * speed * dt,
        )
        lon = moved.lon
        lat = moved.lat
      }

      const probe = sampleVelocity(field, lon, lat, nextTime)
      if (!probe.ok) {
        particle.status =
          probe.reason === 'missing'
            ? 'stranded_land'
            : probe.reason === 'out_of_bounds'
              ? 'out_of_bounds'
              : 'ended_time'
        break
      }

      particle.lon = lon
      particle.lat = lat
      particle.path.push({ lon, lat, timeUtc: new Date(nextTime).toISOString() })
      timeMs = nextTime
    }

    if (particle.status === 'active' && timeMs >= stopMs) {
      particle.status = 'ended_time'
    }
  }

  return {
    engineVersion: DRIFT_ENGINE_VERSION,
    datasetId: manifest.datasetId,
    datasetHash: manifest.currentsSha256,
    seed: request.seed,
    integrator: request.integrator,
    dtSeconds: request.dtSeconds,
    dispersionMps: request.dispersionMps,
    particles,
  }
}
