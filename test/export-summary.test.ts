import { describe, expect, it } from 'vitest'
import type { EpisodeManifest } from '../src/domain/currentField.ts'
import type { DriftRunResult } from '../src/domain/driftEngine.ts'
import {
  EXPORT_DISCLAIMER,
  buildRunExport,
  renderExportHtml,
} from '../src/domain/exportSummary.ts'
import { EXPOSURE_DISCLAIMER, type ExposureReport } from '../src/domain/exposure.ts'

const manifest: EpisodeManifest = {
  id: 'synthetic-steady',
  kind: 'synthetic',
  productId: 'SYNTHETIC',
  datasetId: 'synthetic-steady-eastward',
  regionLabel: 'toy',
  bbox: { west: 1, east: 6, south: 38, north: 43 },
  startUtc: '2024-09-01T00:00:00.000Z',
  endUtc: '2024-09-04T00:00:00.000Z',
  stepHours: 1,
  depthLabel: 'surface',
  units: 'm/s',
  uvConvention: 'oceanographic-east-north',
  landMask: 'null-velocity',
  citation: 'Synthetic fixture',
  sourceCommitNote: 'test',
  currentsFile: 'currents.json',
  currentsSha256: 'abc123',
  sizeBytes: 1,
}

const result: DriftRunResult = {
  engineVersion: '0.1.0',
  datasetId: manifest.datasetId,
  datasetHash: manifest.currentsSha256,
  seed: 9,
  integrator: 'rk2',
  dtSeconds: 3600,
  dispersionMps: 0.02,
  particles: [],
}

const exposure: ExposureReport = {
  horizonHours: 48,
  particleCount: 0,
  zones: [
    {
      zoneId: 'z1',
      name: 'Demo zone',
      kind: 'coast_watch',
      contact: 'near',
      particlesInside: 0,
      particlesNearOnly: 2,
      minDistanceKm: 12.3,
      insideSampleCount: 0,
    },
  ],
  outOfDomainParticles: 0,
  disclaimer: EXPOSURE_DISCLAIMER,
  provenanceNote: 'illustrative',
}

describe('exportSummary', () => {
  it('builds deterministic JSON fields for injected clock', () => {
    const payload = buildRunExport({
      manifest,
      result,
      origin: { lon: 3, lat: 40 },
      startUtc: manifest.startUtc,
      horizonHours: 48,
      compare: null,
      exposure,
      nowUtc: '2024-09-01T12:00:00.000Z',
    })
    expect(payload.disclaimer).toBe(EXPORT_DISCLAIMER)
    expect(payload.episode.currentsSha256).toBe('abc123')
    expect(payload.run.seed).toBe(9)
    expect(payload.generatedAtUtc).toBe('2024-09-01T12:00:00.000Z')
    expect(payload.limitations.some((l) => l.toLowerCase().includes('synthetic'))).toBe(true)
  })

  it('renders HTML with escaped exposure rows and no invented metrics', () => {
    const payload = buildRunExport({
      manifest,
      result,
      origin: { lon: 3, lat: 40 },
      startUtc: manifest.startUtc,
      horizonHours: 48,
      compare: null,
      exposure,
      nowUtc: '2024-09-01T12:00:00.000Z',
    })
    const html = renderExportHtml(payload)
    expect(html).toContain('Demo zone')
    expect(html).toContain('abc123')
    expect(html).toContain(EXPORT_DISCLAIMER)
    expect(html).not.toContain('<script')
  })
})
