import type { ExposureZone, ZoneKind } from '../domain/exposure.ts'
import demoZones from './exposure/demo-zones.json'

type RawFeature = {
  type: 'Feature'
  properties: {
    id: string
    name: string
    kind: ZoneKind
    proximityKm: number
  }
  geometry: GeoJSON.Polygon
}

type RawCollection = {
  type: 'FeatureCollection'
  crs: string
  provenance: {
    kind: string
    license: string
    citation: string
    scaleNote: string
    replaceWith: string
  }
  features: RawFeature[]
}

export type ExposureBundle = {
  zones: ExposureZone[]
  geoJson: GeoJSON.FeatureCollection
  provenanceNote: string
  license: string
}

export function loadDemoExposureZones(): ExposureBundle {
  const raw = demoZones as RawCollection
  if (raw.crs !== 'EPSG:4326') {
    throw new Error(`Unsupported exposure CRS: ${raw.crs}`)
  }
  const zones: ExposureZone[] = raw.features.map((feature) => {
    if (feature.geometry.type !== 'Polygon') {
      throw new Error(`Exposure zone ${feature.properties.id} must be a Polygon`)
    }
    return {
      id: feature.properties.id,
      name: feature.properties.name,
      kind: feature.properties.kind,
      proximityKm: feature.properties.proximityKm,
      geometry: feature.geometry,
    }
  })

  const geoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: raw.features.map((feature) => ({
      type: 'Feature',
      properties: {
        id: feature.properties.id,
        name: feature.properties.name,
        kind: feature.properties.kind,
      },
      geometry: feature.geometry,
    })),
  }

  return {
    zones,
    geoJson,
    provenanceNote: `${raw.provenance.citation} ${raw.provenance.scaleNote}`,
    license: raw.provenance.license,
  }
}
