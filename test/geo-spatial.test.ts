import { describe, expect, it } from 'vitest'
import {
  distanceToPolygonM,
  pointInPolygon,
  pointInRing,
} from '../src/domain/geoSpatial.ts'

const square: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
}

describe('geoSpatial', () => {
  it('detects points inside and outside a ring', () => {
    expect(pointInRing({ lon: 0.5, lat: 0.5 }, square.coordinates[0] as Array<[number, number]>)).toBe(
      true,
    )
    expect(pointInRing({ lon: 2, lat: 2 }, square.coordinates[0] as Array<[number, number]>)).toBe(
      false,
    )
  })

  it('returns zero distance inside and positive outside', () => {
    expect(pointInPolygon({ lon: 0.5, lat: 0.5 }, square)).toBe(true)
    expect(distanceToPolygonM({ lon: 0.5, lat: 0.5 }, square)).toBe(0)
    const outside = distanceToPolygonM({ lon: 2, lat: 0.5 }, square)
    expect(outside).toBeGreaterThan(50_000)
  })
})
