import { useEffect, useRef, useState } from 'react'
import {
  GeoJSONSource,
  Map,
  NavigationControl,
  type MapMouseEvent,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE_URL,
} from '../domain/mapDefaults.ts'
import { originGeoJson } from '../domain/playback.ts'

type MapStatus = 'loading' | 'ready' | 'error'

type Props = {
  origin: { lon: number; lat: number } | null
  trails: GeoJSON.FeatureCollection
  particles: GeoJSON.FeatureCollection
  onMapClick: (lon: number, lat: number) => void
}

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export function OceanMap({ origin, trails, particles, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const onClickRef = useRef(onMapClick)
  const [status, setStatus] = useState<MapStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    onClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) {
      return
    }

    let cancelled = false
    const map = new Map({
      container,
      style: MAP_STYLE_URL,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      attributionControl: {},
    })
    map.addControl(new NavigationControl({ visualizePitch: false }), 'top-right')
    mapRef.current = map

    const ensureLayers = () => {
      if (!map.getSource('origin')) {
        map.addSource('origin', { type: 'geojson', data: EMPTY })
        map.addLayer({
          id: 'origin-circle',
          type: 'circle',
          source: 'origin',
          paint: {
            'circle-radius': 8,
            'circle-color': '#d9c4a5',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#063849',
          },
        })
      }
      if (!map.getSource('trails')) {
        map.addSource('trails', { type: 'geojson', data: EMPTY })
        map.addLayer({
          id: 'trails-line',
          type: 'line',
          source: 'trails',
          paint: {
            'line-color': '#7ec8db',
            'line-width': 1.6,
            'line-opacity': 0.85,
          },
        })
      }
      if (!map.getSource('particles')) {
        map.addSource('particles', { type: 'geojson', data: EMPTY })
        map.addLayer({
          id: 'particles-circle',
          type: 'circle',
          source: 'particles',
          paint: {
            'circle-radius': 3.5,
            'circle-color': '#f4fbff',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#0d6e8a',
          },
        })
      }
    }

    const onLoad = () => {
      if (cancelled) {
        return
      }
      ensureLayers()
      setStatus('ready')
      setErrorMessage(null)
    }

    const onError = (event: { error?: Error | { message?: string } }) => {
      if (cancelled) {
        return
      }
      const message =
        event.error instanceof Error
          ? event.error.message
          : (event.error?.message ?? 'Map failed to load')
      setStatus('error')
      setErrorMessage(message)
    }

    const onClick = (event: MapMouseEvent) => {
      onClickRef.current(event.lngLat.lng, event.lngLat.lat)
    }

    map.on('load', onLoad)
    map.on('error', onError)
    map.on('click', onClick)
    map.getCanvas().style.cursor = 'crosshair'

    return () => {
      cancelled = true
      map.off('load', onLoad)
      map.off('error', onError)
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') {
      return
    }
    const originSource = map.getSource('origin') as GeoJSONSource | undefined
    originSource?.setData(originGeoJson(origin))
  }, [origin, status])

  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') {
      return
    }
    const trailsSource = map.getSource('trails') as GeoJSONSource | undefined
    trailsSource?.setData(trails)
  }, [trails, status])

  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') {
      return
    }
    const particleSource = map.getSource('particles') as GeoJSONSource | undefined
    particleSource?.setData(particles)
  }, [particles, status])

  return (
    <div className="map-frame" aria-busy={status === 'loading'}>
      <div
        ref={containerRef}
        className="map-canvas"
        role="application"
        aria-label="Ocean map. Click the sea to set a drift origin."
      />
      {status === 'loading' ? (
        <div className="map-overlay" role="status">
          Loading map…
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="map-overlay map-overlay--error" role="alert">
          <p>Could not load the basemap.</p>
          <p className="map-overlay__detail">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  )
}
