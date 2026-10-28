import type { EpisodeManifest } from './currentField.ts'
import type { DriftRunResult } from './driftEngine.ts'
import type { CompareSummary } from './scenarioCompare.ts'
import type { ExposureReport } from './exposure.ts'

export type RunExportPayload = {
  schemaVersion: '1.0.0'
  generatedAtUtc: string
  disclaimer: string
  episode: {
    id: string
    kind: EpisodeManifest['kind']
    datasetId: string
    currentsSha256: string
    citation: string
    startUtc: string
    endUtc: string
  }
  run: {
    engineVersion: string
    seed: number
    integrator: string
    dtSeconds: number
    dispersionMps: number
    particleCount: number
    origin: { lon: number; lat: number }
    startUtc: string
    horizonHours: number
  }
  compare: CompareSummary | null
  exposure: ExposureReport | null
  limitations: string[]
}

export const EXPORT_DISCLAIMER =
  'Deterministic OceanDrift run summary — exploratory only. Not an operational forecast. Scenario frequencies are not calibrated impact probabilities.'

export function buildRunExport(input: {
  manifest: EpisodeManifest
  result: DriftRunResult
  origin: { lon: number; lat: number }
  startUtc: string
  horizonHours: number
  compare: CompareSummary | null
  exposure: ExposureReport | null
  nowUtc?: string
}): RunExportPayload {
  return {
    schemaVersion: '1.0.0',
    generatedAtUtc: input.nowUtc ?? new Date().toISOString(),
    disclaimer: EXPORT_DISCLAIMER,
    episode: {
      id: input.manifest.id,
      kind: input.manifest.kind,
      datasetId: input.manifest.datasetId,
      currentsSha256: input.manifest.currentsSha256,
      citation: input.manifest.citation,
      startUtc: input.manifest.startUtc,
      endUtc: input.manifest.endUtc,
    },
    run: {
      engineVersion: input.result.engineVersion,
      seed: input.result.seed,
      integrator: input.result.integrator,
      dtSeconds: input.result.dtSeconds,
      dispersionMps: input.result.dispersionMps,
      particleCount: input.result.particles.length,
      origin: input.origin,
      startUtc: input.startUtc,
      horizonHours: input.horizonHours,
    },
    compare: input.compare,
    exposure: input.exposure,
    limitations: [
      'No beach-level arrival time is claimed.',
      'No calibrated environmental risk is claimed.',
      'Exposure polygons in the demo fixture are illustrative, not official MPA boundaries.',
      'Particle counts and scenario frequencies are sensitivity diagnostics, not probabilities.',
      input.manifest.kind === 'synthetic'
        ? 'Currents are a synthetic labeled fixture, not a live Copernicus download.'
        : 'Currents attribution follows the episode citation.',
    ],
  }
}

/** Deterministic printable HTML from a payload — no LLM, no invented numbers. */
export function renderExportHtml(payload: RunExportPayload): string {
  const rows = (payload.exposure?.zones ?? [])
    .map(
      (z) =>
        `<tr><td>${escapeHtml(z.name)}</td><td>${z.contact}</td><td>${z.particlesInside}</td><td>${z.particlesNearOnly}</td><td>${formatKm(z.minDistanceKm)}</td></tr>`,
    )
    .join('')

  const compareBlock = payload.compare
    ? `<section><h2>Sensitivity compare</h2><p>Mode: ${escapeHtml(payload.compare.mode)} · Endpoint Δ: ${formatM(payload.compare.endpointSeparationM)}</p><p class="note">${escapeHtml(payload.compare.disclaimer)}</p></section>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>OceanDrift run summary</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem; color: #102028; }
    h1 { font-size: 1.6rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #9bb; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.9rem; }
    .note { color: #445; font-size: 0.85rem; }
    .banner { background: #c9a227; color: #1a1404; padding: 0.5rem 0.75rem; font-weight: 600; }
    code { font-family: ui-monospace, monospace; font-size: 0.85rem; }
  </style>
</head>
<body>
  <p class="banner">${escapeHtml(payload.disclaimer)}</p>
  <h1>OceanDrift run summary</h1>
  <p>Generated ${escapeHtml(payload.generatedAtUtc)}</p>
  <section>
    <h2>Episode</h2>
    <ul>
      <li>Kind: <code>${escapeHtml(payload.episode.kind)}</code></li>
      <li>Dataset: <code>${escapeHtml(payload.episode.datasetId)}</code></li>
      <li>Hash: <code>${escapeHtml(payload.episode.currentsSha256)}</code></li>
      <li>Coverage: ${escapeHtml(payload.episode.startUtc)} → ${escapeHtml(payload.episode.endUtc)}</li>
      <li>${escapeHtml(payload.episode.citation)}</li>
    </ul>
  </section>
  <section>
    <h2>Run parameters</h2>
    <ul>
      <li>Engine ${escapeHtml(payload.run.engineVersion)} · seed ${payload.run.seed} · ${escapeHtml(payload.run.integrator)} · dt ${payload.run.dtSeconds}s</li>
      <li>Origin ${payload.run.origin.lon.toFixed(3)}°E, ${payload.run.origin.lat.toFixed(3)}°N</li>
      <li>Start ${escapeHtml(payload.run.startUtc)} · horizon ${payload.run.horizonHours} h · particles ${payload.run.particleCount}</li>
      <li>Dispersion ${payload.run.dispersionMps} m/s</li>
    </ul>
  </section>
  ${compareBlock}
  <section>
    <h2>Exposure ranking</h2>
    ${
      payload.exposure
        ? `<p class="note">${escapeHtml(payload.exposure.disclaimer)}</p>
    <p class="note">${escapeHtml(payload.exposure.provenanceNote)}</p>
    <table>
      <thead><tr><th>Zone</th><th>Contact</th><th>Inside</th><th>Near only</th><th>Min distance</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No zone contacts</td></tr>'}</tbody>
    </table>`
        : '<p>No exposure report attached.</p>'
    }
  </section>
  <section>
    <h2>Limitations</h2>
    <ul>${payload.limitations.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
  </section>
</body>
</html>`
}

function formatKm(km: number): string {
  if (!Number.isFinite(km)) {
    return '—'
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

function formatM(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
