import { useEffect, useRef, useState } from 'react'
import { Map, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE_URL,
} from '../domain/mapDefaults.ts'

type MapStatus = 'loading' | 'ready' | 'error'

export function OceanMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const [status, setStatus] = useState<MapStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

    const onLoad = () => {
      if (!cancelled) {
        setStatus('ready')
        setErrorMessage(null)
      }
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

    map.on('load', onLoad)
    map.on('error', onError)

    return () => {
      cancelled = true
      map.off('load', onLoad)
      map.off('error', onError)
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="map-frame" aria-busy={status === 'loading'}>
      <div ref={containerRef} className="map-canvas" role="application" aria-label="Ocean map" />
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
