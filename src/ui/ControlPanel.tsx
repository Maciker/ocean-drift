import type { EpisodeManifest } from '../domain/currentField.ts'
import type { HorizonHours } from '../domain/playback.ts'
import type { DriftRunResult } from '../domain/driftEngine.ts'
import type { CompareMode, CompareSummary } from '../domain/scenarioCompare.ts'
import { SENSITIVITY_DISCLAIMER } from '../domain/scenarioCompare.ts'

type Props = {
  manifest: EpisodeManifest
  origin: { lon: number; lat: number } | null
  startUtc: string
  horizon: HorizonHours
  compareMode: CompareMode
  coverageHint: string
  busy: boolean
  playing: boolean
  scrubIndex: number
  scrubMax: number
  scrubTimeUtc: string
  statusMessage: string | null
  errorMessage: string | null
  result: DriftRunResult | null
  compareSummary: CompareSummary | null
  reducedMotion: boolean
  onHorizonChange: (horizon: HorizonHours) => void
  onStartUtcChange: (value: string) => void
  onCompareModeChange: (mode: CompareMode) => void
  onRun: () => void
  onPlayPause: () => void
  onReset: () => void
  onScrub: (index: number) => void
  onClearOrigin: () => void
  onClearCompare: () => void
}

export function ControlPanel(props: Props) {
  const horizons: HorizonHours[] = [24, 48, 72]
  const compareModes: Array<{ id: CompareMode; label: string }> = [
    { id: 'off', label: 'Off' },
    { id: 'origin_offset', label: 'Origin Δ' },
    { id: 'start_offset', label: 'Start Δ' },
    { id: 'dispersion', label: 'Dispersion' },
  ]

  return (
    <aside className="control-panel" aria-label="Simulation controls">
      <div className="panel-section">
        <h2>Origin</h2>
        {props.origin ? (
          <p className="mono">
            {props.origin.lon.toFixed(3)}°E, {props.origin.lat.toFixed(3)}°N
          </p>
        ) : (
          <p className="hint">Click the sea on the map to set an origin.</p>
        )}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={props.onClearOrigin}
          disabled={!props.origin || props.busy}
        >
          Clear origin
        </button>
      </div>

      <div className="panel-section">
        <h2>Start (UTC)</h2>
        <label className="sr-only" htmlFor="start-utc">
          Start time UTC
        </label>
        <input
          id="start-utc"
          className="field"
          type="datetime-local"
          value={toLocalInputValue(props.startUtc)}
          onChange={(event) => props.onStartUtcChange(fromLocalInputValue(event.target.value))}
          disabled={props.busy}
        />
        <p className="hint">{props.coverageHint}</p>
      </div>

      <div className="panel-section">
        <h2>Horizon</h2>
        <div className="btn-row" role="group" aria-label="Horizon hours">
          {horizons.map((h) => (
            <button
              key={h}
              type="button"
              className={props.horizon === h ? 'btn btn-active' : 'btn'}
              onClick={() => props.onHorizonChange(h)}
              disabled={props.busy}
              aria-pressed={props.horizon === h}
            >
              {h} h
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h2>Compare (sensitivity)</h2>
        <div className="btn-row" role="group" aria-label="Compare mode">
          {compareModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={props.compareMode === mode.id ? 'btn btn-active' : 'btn'}
              onClick={() => props.onCompareModeChange(mode.id)}
              disabled={props.busy}
              aria-pressed={props.compareMode === mode.id}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="hint">{SENSITIVITY_DISCLAIMER}</p>
        {props.compareMode !== 'off' ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={props.onClearCompare}
            disabled={props.busy}
          >
            Clear compare
          </button>
        ) : null}
      </div>

      <div className="panel-section">
        <h2>Playback</h2>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={props.onRun}
            disabled={!props.origin || props.busy}
          >
            {props.busy ? 'Computing…' : 'Run drift'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={props.onPlayPause}
            disabled={!props.result || props.busy || props.reducedMotion}
          >
            {props.playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={props.onReset}
            disabled={!props.result || props.busy}
          >
            Reset
          </button>
        </div>
        <label className="scrub-label" htmlFor="scrub">
          Time scrub ({props.scrubTimeUtc || '—'})
        </label>
        <input
          id="scrub"
          className="scrub"
          type="range"
          min={0}
          max={Math.max(props.scrubMax, 0)}
          value={props.scrubIndex}
          onChange={(event) => props.onScrub(Number(event.target.value))}
          disabled={!props.result || props.busy}
        />
        {props.reducedMotion ? (
          <p className="hint">Reduced motion: animation disabled; scrub to inspect frames.</p>
        ) : null}
      </div>

      {props.compareSummary ? (
        <div className="panel-section compare-summary">
          <h2>Difference summary</h2>
          <dl>
            <div>
              <dt>Mode</dt>
              <dd>{props.compareSummary.mode.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt>Endpoint Δ</dt>
              <dd className="mono">
                {formatMeters(props.compareSummary.endpointSeparationM)}
              </dd>
            </div>
            <div>
              <dt>Still moving</dt>
              <dd>
                base {props.compareSummary.baseActiveCount} · variant{' '}
                {props.compareSummary.variantActiveCount}
              </dd>
            </div>
          </dl>
          <p className="hint">{props.compareSummary.disclaimer}</p>
        </div>
      ) : null}

      {props.statusMessage ? (
        <p className="status" role="status">
          {props.statusMessage}
        </p>
      ) : null}
      {props.errorMessage ? (
        <p className="status status-error" role="alert">
          {props.errorMessage}
        </p>
      ) : null}

      <div className="panel-section legend">
        <h2>Legend</h2>
        <ul>
          <li>
            <span className="swatch swatch-origin" /> Origin
          </li>
          <li>
            <span className="swatch swatch-trail" /> Base trajectory
          </li>
          <li>
            <span className="swatch swatch-particle" /> Base particle
          </li>
          {props.compareMode !== 'off' ? (
            <>
              <li>
                <span className="swatch swatch-trail-variant" /> Variant trajectory
              </li>
              <li>
                <span className="swatch swatch-particle-variant" /> Variant particle
              </li>
            </>
          ) : null}
        </ul>
        <p className="hint">
          Exploratory advection — not beach-level arrival and not calibrated
          probabilities.
        </p>
      </div>

      <div className="panel-section provenance">
        <h2>Provenance</h2>
        <dl>
          <div>
            <dt>Kind</dt>
            <dd>{props.manifest.kind}</dd>
          </div>
          <div>
            <dt>Dataset</dt>
            <dd className="mono">{props.manifest.datasetId}</dd>
          </div>
          <div>
            <dt>Hash</dt>
            <dd className="mono truncate">{props.manifest.currentsSha256.slice(0, 12)}…</dd>
          </div>
          {props.result ? (
            <div>
              <dt>Engine</dt>
              <dd className="mono">
                {props.result.engineVersion} · seed {props.result.seed}
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="hint">{props.manifest.citation}</p>
      </div>
    </aside>
  )
}

function formatMeters(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

function toLocalInputValue(iso: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) {
    return ''
  }
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function fromLocalInputValue(value: string): string {
  if (!value) {
    return new Date().toISOString()
  }
  // Treat datetime-local as UTC for the demo (explicit UTC label in UI).
  return `${value}:00.000Z`
}
