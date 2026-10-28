import { describe, expect, it } from 'vitest'
import type { CurrentField, EpisodeManifest } from '../src/domain/currentField.ts'
import { runDrift } from '../src/domain/driftEngine.ts'
import { sampleVelocity } from '../src/domain/interpolate.ts'

function holeField(): { field: CurrentField; manifest: EpisodeManifest } {
  const lon = [2, 3, 4]
  const lat = [39, 40, 41]
  const timesUtc = [
    '2024-09-01T00:00:00.000Z',
    '2024-09-01T01:00:00.000Z',
    '2024-09-01T02:00:00.000Z',
  ]
  const plane = (fill: number | null) =>
    lat.map((_, j) => lon.map((_, i) => (i === 1 && j === 1 ? null : fill)))
  const field: CurrentField = {
    timesUtc,
    lon,
    lat,
    u: timesUtc.map(() => plane(0.1)),
    v: timesUtc.map(() => plane(0)),
  }
  const manifest: EpisodeManifest = {
    id: 'hole',
    kind: 'synthetic',
    productId: 'SYNTHETIC',
    datasetId: 'hole',
    regionLabel: 'hole',
    bbox: { west: 2, east: 4, south: 39, north: 41 },
    startUtc: timesUtc[0]!,
    endUtc: timesUtc[timesUtc.length - 1]!,
    stepHours: 1,
    depthLabel: 'surface',
    units: 'm/s',
    uvConvention: 'oceanographic-east-north',
    landMask: 'null-velocity',
    citation: 'test',
    sourceCommitNote: 'test',
    currentsFile: 'n/a',
    currentsSha256: 'hole',
    sizeBytes: 0,
  }
  return { field, manifest }
}

describe('adversarial drift / sampling', () => {
  it('treats null neighbors as missing, not as zero velocity', () => {
    const { field } = holeField()
    const sample = sampleVelocity(field, 3, 40, Date.parse(field.timesUtc[0]!))
    expect(sample.ok).toBe(false)
    if (!sample.ok) {
      expect(sample.reason).toBe('missing')
    }
  })

  it('rejects times after the last frame', () => {
    const { field } = holeField()
    const after = Date.parse(field.timesUtc[field.timesUtc.length - 1]!) + 3600_000
    const sample = sampleVelocity(field, 2.2, 39.2, after)
    expect(sample.ok).toBe(false)
    if (!sample.ok) {
      expect(sample.reason).toBe('no_time')
    }
  })

  it('marks particles out_of_bounds when they leave the grid', () => {
    const lon = [2, 3]
    const lat = [40, 41]
    const timesUtc = ['2024-09-01T00:00:00.000Z', '2024-09-01T06:00:00.000Z']
    const field: CurrentField = {
      timesUtc,
      lon,
      lat,
      u: timesUtc.map(() => lat.map(() => lon.map(() => 2.0))),
      v: timesUtc.map(() => lat.map(() => lon.map(() => 0))),
    }
    const manifest: EpisodeManifest = {
      id: 'oob',
      kind: 'synthetic',
      productId: 'SYNTHETIC',
      datasetId: 'oob',
      regionLabel: 'oob',
      bbox: { west: 2, east: 3, south: 40, north: 41 },
      startUtc: timesUtc[0]!,
      endUtc: timesUtc[1]!,
      stepHours: 6,
      depthLabel: 'surface',
      units: 'm/s',
      uvConvention: 'oceanographic-east-north',
      landMask: 'null-velocity',
      citation: 'test',
      sourceCommitNote: 'test',
      currentsFile: 'n/a',
      currentsSha256: 'oob',
      sizeBytes: 0,
    }
    const result = runDrift({
      field,
      manifest,
      origin: { lon: 2.9, lat: 40.5 },
      startUtc: timesUtc[0]!,
      horizonHours: 6,
      particleCount: 1,
      dtSeconds: 1800,
      integrator: 'euler',
      seed: 1,
      dispersionMps: 0,
    })
    expect(result.particles[0]!.status).toBe('out_of_bounds')
  })

  it('survives a large particle budget without throwing', () => {
    const lon = [2, 3, 4, 5]
    const lat = [39, 40, 41, 42]
    const timesUtc = Array.from({ length: 13 }, (_, h) =>
      new Date(Date.parse('2024-09-01T00:00:00.000Z') + h * 3600_000).toISOString(),
    )
    const plane = lat.map(() => lon.map(() => 0.05))
    const field: CurrentField = {
      timesUtc,
      lon,
      lat,
      u: timesUtc.map(() => plane.map((row) => [...row])),
      v: timesUtc.map(() => plane.map((row) => [...row])),
    }
    const manifest: EpisodeManifest = {
      id: 'pressure',
      kind: 'synthetic',
      productId: 'SYNTHETIC',
      datasetId: 'pressure',
      regionLabel: 'pressure',
      bbox: { west: 2, east: 5, south: 39, north: 42 },
      startUtc: timesUtc[0]!,
      endUtc: timesUtc[timesUtc.length - 1]!,
      stepHours: 1,
      depthLabel: 'surface',
      units: 'm/s',
      uvConvention: 'oceanographic-east-north',
      landMask: 'null-velocity',
      citation: 'test',
      sourceCommitNote: 'test',
      currentsFile: 'n/a',
      currentsSha256: 'pressure',
      sizeBytes: 0,
    }
    const started = performance.now()
    const result = runDrift({
      field,
      manifest,
      origin: { lon: 3.5, lat: 40.5 },
      startUtc: timesUtc[0]!,
      horizonHours: 12,
      particleCount: 256,
      dtSeconds: 3600,
      integrator: 'rk2',
      seed: 99,
      dispersionMps: 0.01,
    })
    const elapsedMs = performance.now() - started
    expect(result.particles).toHaveLength(256)
    expect(elapsedMs).toBeLessThan(5_000)
  })
})
