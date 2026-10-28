/** Mean meters per degree of latitude (WGS84 spherical approximation). */
export const METERS_PER_DEG_LAT = 111_320

export function metersPerDegLon(latDeg: number): number {
  const cos = Math.cos((latDeg * Math.PI) / 180)
  // Avoid division by zero near the poles (outside our Mediterranean domain).
  return METERS_PER_DEG_LAT * Math.max(Math.abs(cos), 1e-6)
}

export function displaceLonLat(
  lon: number,
  lat: number,
  eastMeters: number,
  northMeters: number,
): { lon: number; lat: number } {
  const dLat = northMeters / METERS_PER_DEG_LAT
  const dLon = eastMeters / metersPerDegLon(lat)
  return { lon: lon + dLon, lat: lat + dLat }
}
