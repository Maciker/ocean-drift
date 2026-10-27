import { describe, expect, it } from 'vitest'
import type { CurrentField, EpisodeManifest } from '../src/domain/currentField.ts'
import { METERS_PER_DEG_LAT, metersPerDegLon } from '../src/domain/geo.ts'
import { DRIFT_ENGINE_VERSION, runDrift } from '../src/domain/driftEngine.ts'
import { sampleVelocity } from '../src/domain/interpolate.ts'
function constantField(options: {
  u: number
  v: number
  hours?: number
}): { field: CurrentField; manifest: EpisodeManifest } {
  const hours = options.hours ?? 24
  const lon = [2, 3, 4, 5]
  const lat = [39, 40, 41, 42]
  const start = Date.parse('2024-09-01T00:00:00.000Z')
  const timesUtc = Array.from({ length: hours + 1 }, (_, h) =>
    new Date(start + h * 3600_000).toISOString(),
  )
  const planeU = lat.map(() => lon.map(() => options.u))
  const planeV = lat.map(() => lon.map(() => options.v))
  const field: CurrentField = {
    timesUtc,
    lon,
    lat,
    u: timesUtc.map(() => planeU.map((row) => [...row])),
    v: timesUtc.map(() => planeV.map((row) => [...row])),
  }
  const manifest: EpisodeManifest = {
    id: 'analytic-constant',
    kind: 'synthetic',
    productId: 'SYNTHETIC',
    datasetId: 'analytic-constant',
    regionLabel: 'analytic',
    bbox: { west: 2, east: 5, south: 39, north: 42 },
    startUtc: timesUtc[0]!,
    endUtc: timesUtc[timesUtc.length - 1]!,
    stepHours: 1,
    depthLabel: 'surface',
    units: 'm/s',
    uvConvention: 'oceanographic-east-north',
    landMask: 'null-velocity',
    citation: 'analytic test field',
    sourceCommitNote: 'test',
    currentsFile: 'n/a',
    currentsSha256: 'test',
    sizeBytes: 0,
  }
  return { field, manifest }
}

describe('sampleVelocity', () => {
  it('interpolates a constant field', () => {
    const { field } = constantField({ u: 0.3, v: -0.1 })
    const sample = sampleVelocity(field, 3.5, 40.5, Date.parse(field.timesUtc[0]!))
    expect(sample.ok).toBe(true)
    if (sample.ok) {
      expect(sample.u).toBeCloseTo(0.3, 8)
      expect(sample.v).toBeCloseTo(-0.1, 8)
    }
  })
})

describe('runDrift', () => {
  it('stays put on a zero field', () => {
    const { field, manifest } = constantField({ u: 0, v: 0 })
    const result = runDrift({
      field,
      manifest,
      origin: { lon: 3.5, lat: 40.5 },
      startUtc: field.timesUtc[0]!,
      horizonHours: 6,
      particleCount: 1,
      dtSeconds: 3600,
      integrator: 'euler',
      seed: 1,
      dispersionMps: 0,
    })
    const particle = result.particles[0]!
    expect(particle.lon).toBeCloseTo(3.5, 8)
    expect(particle.lat).toBeCloseTo(40.5, 8)
    expect(particle.status).toBe('ended_time')
  })

  it('matches analytic eastward displacement for constant current', () => {
    const u = 0.5
    const hours = 6
    const { field, manifest } = constantField({ u, v: 0, hours })
    const origin = { lon: 3.2, lat: 40.5 }
    const result = runDrift({
      field,
      manifest,
      origin,
      startUtc: field.timesUtc[0]!,
      horizonHours: hours,
      particleCount: 1,
      dtSeconds: 3600,
      integrator: 'euler',
      seed: 7,
      dispersionMps: 0,
    })
    const particle = result.particles[0]!
    const eastMeters = u * hours * 3600
    const expectedLon = origin.lon + eastMeters / metersPerDegLon(origin.lat)
    expect(particle.lon).toBeCloseTo(expectedLon, 5)
    expect(particle.lat).toBeCloseTo(origin.lat, 5)
    expect(result.datasetHash).toBe(manifest.currentsSha256)
    expect(result.engineVersion).toBe(DRIFT_ENGINE_VERSION)
  })

  it('matches analytic northward displacement', () => {
    const v = 0.4
    const hours = 3
    const { field, manifest } = constantField({ u: 0, v, hours })
    const origin = { lon: 3.5, lat: 40.2 }
    const result = runDrift({
      field,
      manifest,
      origin,
      startUtc: field.timesUtc[0]!,
      horizonHours: hours,
      particleCount: 1,
      dtSeconds: 1800,
      integrator: 'rk2',
      seed: 3,
      dispersionMps: 0,
    })
    const particle = result.particles[0]!
    const northMeters = v * hours * 3600
    const expectedLat = origin.lat + northMeters / METERS_PER_DEG_LAT
    expect(particle.lat).toBeCloseTo(expectedLat, 5)
    expect(particle.lon).toBeCloseTo(origin.lon, 5)
  })

  it('strands on land instead of crossing silently', () => {
    const lon = [3, 4]
    const lat = [42.5, 43.0, 43.5]
    const timesUtc = ['2024-09-01T00:00:00.000Z', '2024-09-01T06:00:00.000Z']
    const field: CurrentField = {
      timesUtc,
      lon,
      lat,
      u: timesUtc.map(() => lat.map(() => lon.map(() => 0))),
      v: timesUtc.map(() =>
        lat.map((y) => lon.map(() => (y >= 43.4 ? null : 0.8))),
      ),
    }
    const manifest: EpisodeManifest = {
      id: 'land-wall',
      kind: 'synthetic',
      productId: 'SYNTHETIC',
      datasetId: 'land-wall',
      regionLabel: 'land-wall',
      bbox: { west: 3, east: 4, south: 42.5, north: 43.5 },
      startUtc: timesUtc[0]!,
      endUtc: timesUtc[1]!,
      stepHours: 6,
      depthLabel: 'surface',
      units: 'm/s',
      uvConvention: 'oceanographic-east-north',
      landMask: 'null-velocity',
      citation: 'analytic',
      sourceCommitNote: 'test',
      currentsFile: 'n/a',
      currentsSha256: 'test',
      sizeBytes: 0,
    }
    const result = runDrift({
      field,
      manifest,
      origin: { lon: 3.5, lat: 42.6 },
      startUtc: timesUtc[0]!,
      horizonHours: 6,
      particleCount: 1,
      dtSeconds: 1800,
      integrator: 'euler',
      seed: 1,
      dispersionMps: 0,
    })
    const particle = result.particles[0]!
    expect(particle.status).toBe('stranded_land')
    expect(particle.lat).toBeLessThan(43.5)
  })

  it('reproduces dispersed runs with the same seed', () => {
    const { field, manifest } = constantField({ u: 0.2, v: 0.05 })
    const base = {
      field,
      manifest,
      origin: { lon: 3.5, lat: 40.5 },
      startUtc: field.timesUtc[0]!,
      horizonHours: 12,
      particleCount: 5,
      dtSeconds: 3600,
      integrator: 'euler' as const,
      seed: 42,
      dispersionMps: 0.05,
    }
    const a = runDrift(base)
    const b = runDrift(base)
    expect(a.particles.map((p) => p.path)).toEqual(b.particles.map((p) => p.path))
  })

  it('rejects invalid configuration before producing results', () => {
    const { field, manifest } = constantField({ u: 0, v: 0 })
    expect(() =>
      runDrift({
        field,
        manifest,
        origin: { lon: 3.5, lat: 40.5 },
        startUtc: field.timesUtc[0]!,
        horizonHours: 1,
        particleCount: 0,
        dtSeconds: 3600,
        integrator: 'euler',
        seed: 1,
        dispersionMps: 0,
      }),
    ).toThrow(/particleCount/)
  })
})
