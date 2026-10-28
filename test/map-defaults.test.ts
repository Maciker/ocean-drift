import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE_URL,
  centerAsLonLat,
} from '../src/domain/mapDefaults.ts'

describe('mapDefaults', () => {
  it('centers on the western Mediterranean', () => {
    const [lon, lat] = DEFAULT_MAP_CENTER
    expect(lon).toBeGreaterThan(0)
    expect(lon).toBeLessThan(20)
    expect(lat).toBeGreaterThan(30)
    expect(lat).toBeLessThan(50)
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThan(3)
    expect(centerAsLonLat()).toEqual({ lon, lat })
  })

  it('uses the keyless MapLibre demotiles style', () => {
    expect(MAP_STYLE_URL).toContain('demotiles.maplibre.org')
  })
})
