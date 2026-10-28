import { describe, expect, it } from 'vitest'
import type { DriftRunResult } from '../src/domain/driftEngine.ts'
import {
  DEMO_PARTICLE_COUNT,
  buildTimeline,
  frameAtIndex,
  originGeoJson,
  particlesGeoJson,
  trailsGeoJson,
} from '../src/domain/playback.ts'

function sampleResult(): DriftRunResult {
  return {
    engineVersion: '0.1.0',
    datasetId: 'test',
    datasetHash: 'abc',
    seed: 1,
    integrator: 'rk2',
    dtSeconds: 3600,
    dispersionMps: 0,
    particles: [
      {
        id: 0,
        lon: 3.2,
        lat: 40.2,
        status: 'ended_time',
        path: [
          { lon: 3, lat: 40, timeUtc: '2024-09-01T00:00:00.000Z' },
          { lon: 3.1, lat: 40.1, timeUtc: '2024-09-01T01:00:00.000Z' },
          { lon: 3.2, lat: 40.2, timeUtc: '2024-09-01T02:00:00.000Z' },
        ],
      },
      {
        id: 1,
        lon: 3.05,
        lat: 40.05,
        status: 'stranded_land',
        path: [
          { lon: 3, lat: 40, timeUtc: '2024-09-01T00:00:00.000Z' },
          { lon: 3.05, lat: 40.05, timeUtc: '2024-09-01T01:00:00.000Z' },
        ],
      },
    ],
  }
}

describe('playback helpers', () => {
  it('exposes a bounded demo particle budget', () => {
    expect(DEMO_PARTICLE_COUNT).toBeGreaterThan(0)
    expect(DEMO_PARTICLE_COUNT).toBeLessThanOrEqual(64)
  })

  it('builds a timeline from the longest path', () => {
    const timeline = buildTimeline(sampleResult())
    expect(timeline).toEqual([
      '2024-09-01T00:00:00.000Z',
      '2024-09-01T01:00:00.000Z',
      '2024-09-01T02:00:00.000Z',
    ])
  })

  it('holds stranded particles at their last known position', () => {
    const frame = frameAtIndex(sampleResult(), 2)
    expect(frame.timeUtc).toBe('2024-09-01T02:00:00.000Z')
    expect(frame.positions[0]).toMatchObject({ lon: 3.2, lat: 40.2 })
    expect(frame.positions[1]).toMatchObject({ lon: 3.05, lat: 40.05 })
  })

  it('cuts trails to the scrub index', () => {
    const trails = trailsGeoJson(sampleResult(), 1)
    const coords = trails.features[0]?.geometry
    expect(coords?.type).toBe('LineString')
    if (coords?.type === 'LineString') {
      expect(coords.coordinates).toHaveLength(2)
    }
  })

  it('builds particle and origin GeoJSON', () => {
    const frame = frameAtIndex(sampleResult(), 0)
    const particles = particlesGeoJson(frame)
    expect(particles.features).toHaveLength(2)
    expect(originGeoJson(null).features).toHaveLength(0)
    expect(originGeoJson({ lon: 4, lat: 41 }).features[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [4, 41],
    })
  })
})
