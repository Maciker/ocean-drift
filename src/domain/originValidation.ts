import type { CurrentField } from './currentField.ts'
import { sampleVelocity } from './interpolate.ts'

export type OriginValidation =
  | { ok: true }
  | { ok: false; reason: 'land_or_missing' | 'out_of_bounds' | 'outside_time' }

export function validateMarineOrigin(
  field: CurrentField,
  lon: number,
  lat: number,
  timeUtc: string,
): OriginValidation {
  const timeMs = Date.parse(timeUtc)
  if (Number.isNaN(timeMs)) {
    return { ok: false, reason: 'outside_time' }
  }
  const sample = sampleVelocity(field, lon, lat, timeMs)
  if (sample.ok) {
    return { ok: true }
  }
  if (sample.reason === 'missing') {
    return { ok: false, reason: 'land_or_missing' }
  }
  if (sample.reason === 'out_of_bounds') {
    return { ok: false, reason: 'out_of_bounds' }
  }
  return { ok: false, reason: 'outside_time' }
}

export function clampStartUtc(field: CurrentField, desiredUtc: string): string {
  const times = field.timesUtc
  if (times.length === 0) {
    return desiredUtc
  }
  const first = times[0]!
  const last = times[times.length - 1]!
  const desired = Date.parse(desiredUtc)
  const start = Date.parse(first)
  const end = Date.parse(last)
  if (Number.isNaN(desired) || desired < start) {
    return first
  }
  if (desired > end) {
    return last
  }
  // Snap to nearest available frame at or before desired.
  let best = first
  for (const iso of times) {
    if (Date.parse(iso) <= desired) {
      best = iso
    } else {
      break
    }
  }
  return best
}

export function maxHorizonHours(field: CurrentField, startUtc: string): number {
  const start = Date.parse(startUtc)
  const last = Date.parse(field.timesUtc[field.timesUtc.length - 1] ?? '')
  if (Number.isNaN(start) || Number.isNaN(last) || last <= start) {
    return 0
  }
  return Math.floor((last - start) / 3600_000)
}
