import { METERS_PER_DEG_LAT, metersPerDegLon } from './geo.ts'

export type LonLat = { lon: number; lat: number }

/** Ray-casting point-in-polygon for a closed lon/lat ring (EPSG:4326). */
export function pointInRing(point: LonLat, ring: Array<[number, number]>): boolean {
  if (ring.length < 4) {
    return false
  }
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]
    const yi = ring[i]![1]
    const xj = ring[j]![0]
    const yj = ring[j]![1]
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) {
      inside = !inside
    }
  }
  return inside
}

export function pointInPolygon(point: LonLat, polygon: GeoJSON.Polygon): boolean {
  const outer = polygon.coordinates[0]
  if (!outer || !pointInRing(point, outer as Array<[number, number]>)) {
    return false
  }
  for (let h = 1; h < polygon.coordinates.length; h += 1) {
    const hole = polygon.coordinates[h] as Array<[number, number]>
    if (pointInRing(point, hole)) {
      return false
    }
  }
  return true
}

export function planarDistanceM(a: LonLat, b: LonLat): number {
  const midLat = (a.lat + b.lat) / 2
  const east = (b.lon - a.lon) * metersPerDegLon(midLat)
  const north = (b.lat - a.lat) * METERS_PER_DEG_LAT
  return Math.hypot(east, north)
}

function distanceToSegmentM(point: LonLat, a: LonLat, b: LonLat): number {
  const midLat = (a.lat + b.lat + point.lat) / 3
  const ax = 0
  const ay = 0
  const bx = (b.lon - a.lon) * metersPerDegLon(midLat)
  const by = (b.lat - a.lat) * METERS_PER_DEG_LAT
  const px = (point.lon - a.lon) * metersPerDegLon(midLat)
  const py = (point.lat - a.lat) * METERS_PER_DEG_LAT
  const ab2 = bx * bx + by * by
  if (ab2 === 0) {
    return Math.hypot(px, py)
  }
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / ab2))
  const qx = ax + t * bx
  const qy = ay + t * by
  return Math.hypot(px - qx, py - qy)
}

/** Minimum planar distance from point to polygon boundary (meters). 0 if inside. */
export function distanceToPolygonM(point: LonLat, polygon: GeoJSON.Polygon): number {
  if (pointInPolygon(point, polygon)) {
    return 0
  }
  const ring = polygon.coordinates[0]
  if (!ring || ring.length < 2) {
    return Number.POSITIVE_INFINITY
  }
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i < ring.length - 1; i += 1) {
    const start = ring[i]
    const end = ring[i + 1]
    if (!start || !end) {
      continue
    }
    const aLon = start[0]
    const aLat = start[1]
    const bLon = end[0]
    const bLat = end[1]
    if (
      aLon === undefined ||
      aLat === undefined ||
      bLon === undefined ||
      bLat === undefined
    ) {
      continue
    }
    best = Math.min(
      best,
      distanceToSegmentM(point, { lon: aLon, lat: aLat }, { lon: bLon, lat: bLat }),
    )
  }
  return best
}
