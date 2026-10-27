import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { samplePoint } from '../src/domain/currentField.ts'
import {
  assertManifestMatchesField,
  loadSyntheticEpisode,
} from '../src/data/loadEpisode.ts'

describe('synthetic episode fixture', () => {
  it('loads a labeled synthetic field with 72h coverage', () => {
    const { manifest, field } = loadSyntheticEpisode()
    expect(manifest.kind).toBe('synthetic')
    expect(manifest.productId).toContain('SYNTHETIC')
    expect(field.timesUtc).toHaveLength(73)
    assertManifestMatchesField(manifest, field)
  })

  it('matches the recorded sha256 of currents.json', () => {
    const { manifest } = loadSyntheticEpisode()
    const bytes = readFileSync('src/data/episodes/synthetic-steady/currents.json', 'utf8')
    const sha = createHash('sha256').update(bytes, 'utf8').digest('hex')
    expect(sha).toBe(manifest.currentsSha256)
  })

  it('samples steady eastward current in open water', () => {
    const { field } = loadSyntheticEpisode()
    const sample = samplePoint(field, 0, { lon: 3.5, lat: 40.5 })
    expect(sample.u).toBeCloseTo(0.25, 5)
    expect(sample.v).not.toBeNull()
  })

  it('masks land cells as null velocity', () => {
    const { field } = loadSyntheticEpisode()
    const sample = samplePoint(field, 0, { lon: 3.5, lat: 43.5 })
    expect(sample.u).toBeNull()
    expect(sample.v).toBeNull()
  })
})
