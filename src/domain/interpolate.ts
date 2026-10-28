import type { CurrentField } from './currentField.ts'

export type VelocitySample =
  | { ok: true; u: number; v: number }
  | { ok: false; reason: 'missing' | 'out_of_bounds' | 'no_time' }

function axisIndex(axis: number[], value: number): { i0: number; i1: number; t: number } | null {
  if (axis.length === 0) return null
  const first = axis[0]
  const last = axis[axis.length - 1]
  if (first === undefined || last === undefined) return null
  if (value < first || value > last) return null
  if (axis.length === 1) return { i0: 0, i1: 0, t: 0 }

  let i1 = 1
  while (i1 < axis.length && (axis[i1] ?? Number.POSITIVE_INFINITY) < value) {
    i1 += 1
  }
  const i0 = Math.max(0, i1 - 1)
  const x0 = axis[i0]
  const x1 = axis[Math.min(i1, axis.length - 1)]
  if (x0 === undefined || x1 === undefined) return null
  const span = x1 - x0
  const t = span === 0 ? 0 : (value - x0) / span
  return { i0, i1: Math.min(i1, axis.length - 1), t }
}

function bilinear(
  plane: Array<Array<number | null>>,
  lonIdx: { i0: number; i1: number; t: number },
  latIdx: { i0: number; i1: number; t: number },
): number | null {
  const row0 = plane[latIdx.i0]
  const row1 = plane[latIdx.i1]
  if (!row0 || !row1) return null
  const q00 = row0[lonIdx.i0]
  const q10 = row0[lonIdx.i1]
  const q01 = row1[lonIdx.i0]
  const q11 = row1[lonIdx.i1]
  if (q00 === null || q10 === null || q01 === null || q11 === null) return null
  if (q00 === undefined || q10 === undefined || q01 === undefined || q11 === undefined) {
    return null
  }
  const a = q00 * (1 - lonIdx.t) + q10 * lonIdx.t
  const b = q01 * (1 - lonIdx.t) + q11 * lonIdx.t
  return a * (1 - latIdx.t) + b * latIdx.t
}

function samplePlane(
  field: CurrentField,
  tIndex: number,
  lon: number,
  lat: number,
): VelocitySample {
  const lonIdx = axisIndex(field.lon, lon)
  const latIdx = axisIndex(field.lat, lat)
  if (!lonIdx || !latIdx) return { ok: false, reason: 'out_of_bounds' }
  const uPlane = field.u[tIndex]
  const vPlane = field.v[tIndex]
  if (!uPlane || !vPlane) return { ok: false, reason: 'no_time' }
  const u = bilinear(uPlane, lonIdx, latIdx)
  const v = bilinear(vPlane, lonIdx, latIdx)
  if (u === null || v === null) return { ok: false, reason: 'missing' }
  return { ok: true, u, v }
}

/** Sample u/v (m/s) at lon/lat and UTC milliseconds using bilinear + temporal linear mix. */
export function sampleVelocity(
  field: CurrentField,
  lon: number,
  lat: number,
  timeMs: number,
): VelocitySample {
  if (field.timesUtc.length === 0) return { ok: false, reason: 'no_time' }
  const times = field.timesUtc.map((iso) => Date.parse(iso))
  const t0 = times[0]
  const tLast = times[times.length - 1]
  if (t0 === undefined || tLast === undefined || Number.isNaN(t0) || Number.isNaN(tLast)) {
    return { ok: false, reason: 'no_time' }
  }
  if (timeMs < t0 || timeMs > tLast) return { ok: false, reason: 'no_time' }

  let i1 = 1
  while (i1 < times.length && (times[i1] ?? Number.POSITIVE_INFINITY) < timeMs) {
    i1 += 1
  }
  const i0 = Math.max(0, i1 - 1)
  const clampedI1 = Math.min(i1, times.length - 1)
  const a = times[i0]
  const b = times[clampedI1]
  if (a === undefined || b === undefined) return { ok: false, reason: 'no_time' }
  const span = b - a
  const alpha = span === 0 ? 0 : (timeMs - a) / span

  const s0 = samplePlane(field, i0, lon, lat)
  if (alpha === 0 || i0 === clampedI1) return s0
  const s1 = samplePlane(field, clampedI1, lon, lat)
  if (!s0.ok) return s0
  if (!s1.ok) return s1
  return {
    ok: true,
    u: s0.u * (1 - alpha) + s1.u * alpha,
    v: s0.v * (1 - alpha) + s1.v * alpha,
  }
}
