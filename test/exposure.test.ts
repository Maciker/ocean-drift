import { describe, expect, it } from 'vitest'
import type { DriftRunResult } from '../src/domain/driftEngine.ts'
import { EXPOSURE_DISCLAIMER, scoreExposure, type ExposureZone } from '../src/domain/exposure.ts'
import { loadDemoExposureZones } from '../src/data/loadExposureZones.ts'

function resultWithPath(points: Array<{ lon: number; lat: number }>): DriftRunResult {
  return {
    engineVersion: '0.1.0',
    datasetId: 't',
    datasetHash: 'h',
    seed: 1,
    integrator: 'euler',
    dtSeconds: 3600,
    dispersionMps: 0,
    particles: [
      {
        id: 0,
        lon: points[points.length - 1]!.lon,
        lat: points[points.length - 1]!.lat,
        status: 'ended_time',
        path: points.map((p, i) => ({
          ...p,
          timeUtc: new Date(Date.parse('2024-09-01T00:00:00.000Z') + i * 3600_000).toISOString(),
        })),
      },
      {
        id: 1,
        lon: 5,
        lat: 40,
        status: 'out_of_bounds',
        path: [{ lon: 5, lat: 40, timeUtc: '2024-09-01T00:00:00.000Z' }],
      },
    ],
  }
}

const zone: ExposureZone = {
  id: 'box',
  name: 'Box',
  kind: 'coast_watch',
  proximityKm: 50,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [2, 40],
        [3, 40],
        [3, 41],
        [2, 41],
        [2, 40],
      ],
    ],
  },
}

describe('exposure scoring', () => {
  it('ranks inside contact over near-only and avoids double count', () => {
    const report = scoreExposure(
      resultWithPath([
        { lon: 1.5, lat: 40.5 },
        { lon: 2.5, lat: 40.5 },
      ]),
      [zone],
      24,
      'test provenance',
    )
    expect(report.disclaimer).toBe(EXPOSURE_DISCLAIMER)
    expect(report.outOfDomainParticles).toBe(1)
    const scored = report.zones[0]!
    expect(scored.contact).toBe('inside')
    expect(scored.particlesInside).toBe(1)
    expect(scored.particlesNearOnly).toBe(0)
    expect(scored.minDistanceKm).toBe(0)
  })

  it('classifies near without inside', () => {
    const report = scoreExposure(
      resultWithPath([{ lon: 1.7, lat: 40.5 }]),
      [zone],
      12,
      'test',
    )
    expect(report.zones[0]!.contact).toBe('near')
    expect(report.zones[0]!.particlesInside).toBe(0)
    expect(report.zones[0]!.particlesNearOnly).toBe(1)
  })

  it('loads demo zones as EPSG:4326 polygons', () => {
    const bundle = loadDemoExposureZones()
    expect(bundle.zones.length).toBeGreaterThanOrEqual(3)
    expect(bundle.license).toMatch(/MIT/)
    expect(bundle.provenanceNote.toLowerCase()).toContain('not official')
  })
})
