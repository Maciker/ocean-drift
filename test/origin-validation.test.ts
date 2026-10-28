import { describe, expect, it } from 'vitest'
import type { CurrentField } from '../src/domain/currentField.ts'
import {
  clampStartUtc,
  maxHorizonHours,
  validateMarineOrigin,
} from '../src/domain/originValidation.ts'

function openField(): CurrentField {
  const lon = [2, 3, 4]
  const lat = [39, 40, 41]
  const timesUtc = [
    '2024-09-01T00:00:00.000Z',
    '2024-09-01T12:00:00.000Z',
    '2024-09-02T00:00:00.000Z',
    '2024-09-03T00:00:00.000Z',
  ]
  const plane = (fill: number | null) => lat.map(() => lon.map(() => fill))
  return {
    timesUtc,
    lon,
    lat,
    u: timesUtc.map(() => plane(0.2)),
    v: timesUtc.map(() => plane(-0.1)),
  }
}

function landField(): CurrentField {
  const field = openField()
  return {
    ...field,
    u: field.timesUtc.map(() => field.lat.map(() => field.lon.map(() => null))),
    v: field.timesUtc.map(() => field.lat.map(() => field.lon.map(() => null))),
  }
}

describe('originValidation', () => {
  it('rejects land / missing velocity cells', () => {
    const land = validateMarineOrigin(landField(), 3, 40, openField().timesUtc[0]!)
    expect(land).toEqual({ ok: false, reason: 'land_or_missing' })
    const sea = validateMarineOrigin(openField(), 3, 40, openField().timesUtc[0]!)
    expect(sea).toEqual({ ok: true })
  })

  it('rejects out-of-bounds origins', () => {
    const field = openField()
    const result = validateMarineOrigin(field, 10, 50, field.timesUtc[0]!)
    expect(result).toEqual({ ok: false, reason: 'out_of_bounds' })
  })

  it('clamps start times to coverage', () => {
    const field = openField()
    expect(clampStartUtc(field, '2024-08-01T00:00:00.000Z')).toBe(field.timesUtc[0])
    expect(clampStartUtc(field, '2024-09-10T00:00:00.000Z')).toBe(
      field.timesUtc[field.timesUtc.length - 1],
    )
    expect(clampStartUtc(field, '2024-09-01T18:00:00.000Z')).toBe(
      '2024-09-01T12:00:00.000Z',
    )
  })

  it('computes max horizon from remaining coverage', () => {
    const field = openField()
    expect(maxHorizonHours(field, field.timesUtc[0]!)).toBe(48)
    expect(maxHorizonHours(field, field.timesUtc[2]!)).toBe(24)
  })
})
