import { OceanMap } from './OceanMap.tsx'

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="brand">OceanDrift</p>
          <h1>Explore floating debris drift with real Mediterranean currents</h1>
          <p className="lede">
            Select an origin, replay 24–72 hours of surface advection, and inspect
            coastal exposure — exploratory, not an operational forecast.
          </p>
        </div>
        <p className="credit">
          Generated using E.U. Copernicus Marine Service Information · Map tiles:{' '}
          <a
            href="https://demotiles.maplibre.org/"
            target="_blank"
            rel="noreferrer"
          >
            MapLibre demotiles
          </a>
        </p>
      </header>
      <main className="map-stage">
        <OceanMap />
      </main>
    </div>
  )
}
