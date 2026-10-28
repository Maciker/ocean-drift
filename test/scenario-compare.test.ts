import { describe, expect, it } from 'vitest'
import type { CurrentField, EpisodeManifest } from '../src/domain/currentField.ts'
import { runDrift, type DriftRunRequest } from '../src/domain/driftEngine.ts'
import {
  COMPARE_PARTICLE_COUNT,
  MAX_COMPARE_SCENARIOS,
  SENSITIVITY_DISCLAIMER,
  buildCompareScenarios,
  meanEndpoint,
  summarizeCompare,
} from '../src/domain/scenarioCompare.ts'

function constantRequest(): DriftRunRequest {
  const lon = [2, 3, 4, 5]
  const lat = [39, 40, 41, 42]
  const start = Date.parse('2024-09-01T00:00:00.000Z')
  const timesUtc = Array.from({ length: 25 }, (_, h) =>
    new Date(start + h * 3600_000).toISOString(),
  )
  const planeU = lat.map(() => lon.map(() => 0.2))
  const planeV = lat.map(() => lon.map(() => 0))
  const field: CurrentField = {
    timesUtc,
    lon,
    lat,
    u: timesUtc.map(() => planeU.map((row) => [...row])),
    v: timesUtc.map(() => planeV.map((row) => [...row])),
  }
  const manifest: EpisodeManifest = {
    id: 'compare-analytic',
    kind: 'synthetic',
    productId: 'SYNTHETIC',
    datasetId: 'compare-analytic',
    regionLabel: 'analytic',
    bbox: { west: 2, east: 5, south: 39, north: 42 },
    startUtc: timesUtc[0]!,
    endUtc: timesUtc[timesUtc.length - 1]!,
    stepHours: 1,
    depthLabel: 'surface',
    units: 'm/s',
    uvConvention: 'oceanographic-east-north',
    landMask: 'null-velocity',
    citation: 'analytic',
    sourceCommitNote: 'test',
    currentsFile: 'n/a',
    currentsSha256: 'hash',
    sizeBytes: 0,
  }
  return {
    field,
    manifest,
    origin: { lon: 3.2, lat: 40.5 },
    startUtc: timesUtc[0]!,
    horizonHours: 12,
    particleCount: 40,
    dtSeconds: 3600,
    integrator: 'euler',
    seed: 42,
    dispersionMps: 0,
  }
}

describe('scenarioCompare', () => {
  it('caps dual scenarios and particle budget', () => {
    const scenarios = buildCompareScenarios(constantRequest(), 'origin_offset')
    expect(scenarios).toHaveLength(MAX_COMPARE_SCENARIOS)
    expect(scenarios.every((s) => s.request.particleCount <= COMPARE_PARTICLE_COUNT)).toBe(true)
    expect(scenarios[0]!.request.seed).toBe(42)
    expect(scenarios[1]!.request.seed).toBe(43)
    expect(scenarios[1]!.request.origin.lon).toBeCloseTo(3.28, 5)
  })

  it('builds start and dispersion variants with shared dataset', () => {
    const base = constantRequest()
    const start = buildCompareScenarios(base, 'start_offset')
    expect(start[1]!.request.startUtc).toBe('2024-09-01T06:00:00.000Z')
    expect(start[1]!.request.manifest.currentsSha256).toBe(base.manifest.currentsSha256)

    const disp = buildCompareScenarios(base, 'dispersion')
    expect(disp[1]!.request.dispersionMps).toBeGreaterThan(0)
    expect(disp[0]!.request.dispersionMps).toBe(0)
  })

  it('summarizes endpoint separation without claiming probabilities', () => {
    const baseReq = constantRequest()
    const [baseSpec, variantSpec] = buildCompareScenarios(baseReq, 'origin_offset')
    const base = runDrift(baseSpec!.request)
    const variant = runDrift(variantSpec!.request)
    const summary = summarizeCompare('origin_offset', base, variant)
    expect(summary.disclaimer).toBe(SENSITIVITY_DISCLAIMER)
    expect(summary.endpointSeparationM).toBeGreaterThan(0)
    expect(meanEndpoint(base).lon).toBeGreaterThan(baseReq.origin.lon)
  })
})
