import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadSyntheticEpisode } from '../data/loadEpisode.ts'
import type { DriftRunResult } from '../domain/driftEngine.ts'
import {
  DEMO_PARTICLE_COUNT,
  buildTimeline,
  frameAtIndex,
  particlesGeoJson,
  trailsGeoJson,
  type HorizonHours,
} from '../domain/playback.ts'
import {
  clampStartUtc,
  maxHorizonHours,
  validateMarineOrigin,
} from '../domain/originValidation.ts'
import { ControlPanel } from './ControlPanel.tsx'
import { OceanMap } from './OceanMap.tsx'
import { useDriftWorker } from './useDriftWorker.ts'

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function App() {
  const episode = useMemo(() => loadSyntheticEpisode(), [])
  const { run, cancel } = useDriftWorker()

  const [origin, setOrigin] = useState<{ lon: number; lat: number } | null>(null)
  const [startUtc, setStartUtc] = useState(episode.manifest.startUtc)
  const [horizon, setHorizon] = useState<HorizonHours>(48)
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [result, setResult] = useState<DriftRunResult | null>(null)
  const [scrubIndex, setScrubIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(
    'Synthetic episode loaded — not Copernicus Marine data.',
  )
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const timeline = useMemo(() => (result ? buildTimeline(result) : []), [result])
  const frame = useMemo(
    () => (result ? frameAtIndex(result, scrubIndex) : null),
    [result, scrubIndex],
  )
  const trails = useMemo(
    () => (result ? trailsGeoJson(result, scrubIndex) : EMPTY),
    [result, scrubIndex],
  )
  const particles = useMemo(
    () => (frame ? particlesGeoJson(frame) : EMPTY),
    [frame],
  )

  const coverageHint = useMemo(() => {
    const maxH = maxHorizonHours(episode.field, startUtc)
    return `Coverage ${episode.manifest.startUtc.slice(0, 16)}Z → ${episode.manifest.endUtc.slice(0, 16)}Z · max ${maxH} h from start`
  }, [episode, startUtc])

  const onMapClick = useCallback(
    (lon: number, lat: number) => {
      const validation = validateMarineOrigin(episode.field, lon, lat, startUtc)
      if (!validation.ok) {
        setErrorMessage(
          validation.reason === 'land_or_missing'
            ? 'Origin is on land or missing velocity. Click open water.'
            : validation.reason === 'out_of_bounds'
              ? 'Origin is outside the episode grid.'
              : 'Start time is outside episode coverage.',
        )
        return
      }
      setErrorMessage(null)
      setOrigin({ lon, lat })
      setResult(null)
      setPlaying(false)
      setScrubIndex(0)
      setStatusMessage('Origin set. Choose horizon and run drift.')
    },
    [episode.field, startUtc],
  )

  const onStartUtcChange = (value: string) => {
    const clamped = clampStartUtc(episode.field, value)
    setStartUtc(clamped)
    setResult(null)
    setPlaying(false)
    if (clamped !== value) {
      setErrorMessage('Start time snapped to episode coverage.')
    } else {
      setErrorMessage(null)
    }
  }

  const onHorizonChange = (next: HorizonHours) => {
    const maxH = maxHorizonHours(episode.field, startUtc)
    if (next > maxH) {
      setErrorMessage(`Horizon ${next} h exceeds coverage from start (${maxH} h max).`)
      return
    }
    setErrorMessage(null)
    setHorizon(next)
    setResult(null)
    setPlaying(false)
  }

  const onRun = async () => {
    if (!origin) {
      return
    }
    const validation = validateMarineOrigin(episode.field, origin.lon, origin.lat, startUtc)
    if (!validation.ok) {
      setErrorMessage('Cannot run: origin is not a valid marine cell for this start time.')
      return
    }
    const maxH = maxHorizonHours(episode.field, startUtc)
    if (horizon > maxH) {
      setErrorMessage(`Horizon exceeds coverage (${maxH} h max).`)
      return
    }

    setBusy(true)
    setPlaying(false)
    setErrorMessage(null)
    setStatusMessage('Computing drift in worker…')
    try {
      const next = await run({
        field: episode.field,
        manifest: episode.manifest,
        origin,
        startUtc,
        horizonHours: horizon,
        particleCount: DEMO_PARTICLE_COUNT,
        dtSeconds: 3600,
        integrator: 'rk2',
        seed: 20241028,
        dispersionMps: 0.02,
      })
      setResult(next)
      const endIndex = Math.max(buildTimeline(next).length - 1, 0)
      setScrubIndex(reducedMotion ? endIndex : 0)
      setStatusMessage(
        reducedMotion
          ? 'Simulation finished (reduced motion — scrub to inspect).'
          : 'Simulation ready. Press Play or scrub time.',
      )
      if (!reducedMotion) {
        setPlaying(true)
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Cancelled') {
        setStatusMessage('Previous run cancelled.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Drift run failed')
        setStatusMessage(null)
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!playing || !result || reducedMotion) {
      return
    }
    const max = Math.max(timeline.length - 1, 0)
    const id = window.setInterval(() => {
      setScrubIndex((current) => {
        if (current >= max) {
          setPlaying(false)
          setStatusMessage('Simulation finished.')
          return max
        }
        return current + 1
      })
    }, 120)
    return () => window.clearInterval(id)
  }, [playing, result, reducedMotion, timeline.length])

  useEffect(() => () => cancel(), [cancel])

  return (
    <div className="app-shell">
      {episode.manifest.kind === 'synthetic' ? (
        <div className="banner" role="status">
          Synthetic currents fixture — labeled demo data, not live Copernicus download.
        </div>
      ) : null}
      <header className="app-header">
        <div className="brand-block">
          <p className="brand">OceanDrift</p>
          <h1>Explore floating debris drift with Mediterranean surface currents</h1>
          <p className="lede">
            Origin → advection → inspect. Exploratory only — not an operational forecast
            and not calibrated probabilities.
          </p>
        </div>
        <p className="credit">
          Generated using E.U. Copernicus Marine Service Information · Map tiles:{' '}
          <a href="https://demotiles.maplibre.org/" target="_blank" rel="noreferrer">
            MapLibre demotiles
          </a>
        </p>
      </header>
      <div className="workspace">
        <ControlPanel
          manifest={episode.manifest}
          origin={origin}
          startUtc={startUtc}
          horizon={horizon}
          coverageHint={coverageHint}
          busy={busy}
          playing={playing}
          scrubIndex={scrubIndex}
          scrubMax={Math.max(timeline.length - 1, 0)}
          scrubTimeUtc={frame?.timeUtc ?? ''}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
          result={result}
          reducedMotion={reducedMotion}
          onHorizonChange={onHorizonChange}
          onStartUtcChange={onStartUtcChange}
          onRun={() => {
            void onRun()
          }}
          onPlayPause={() => setPlaying((value) => !value)}
          onReset={() => {
            setPlaying(false)
            setScrubIndex(0)
            setStatusMessage('Reset to start of run.')
          }}
          onScrub={(index) => {
            setPlaying(false)
            setScrubIndex(index)
          }}
          onClearOrigin={() => {
            setOrigin(null)
            setResult(null)
            setPlaying(false)
            setScrubIndex(0)
            setStatusMessage('Click the sea to set an origin.')
          }}
        />
        <main className="map-stage">
          <OceanMap
            origin={origin}
            trails={trails}
            particles={particles}
            onMapClick={onMapClick}
          />
        </main>
      </div>
    </div>
  )
}
