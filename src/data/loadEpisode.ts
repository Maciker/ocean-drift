import type { CurrentField, EpisodeBundle, EpisodeManifest } from '../domain/currentField.ts'
import syntheticManifest from './episodes/synthetic-steady/manifest.json'
import syntheticCurrents from './episodes/synthetic-steady/currents.json'

export function loadSyntheticEpisode(): EpisodeBundle {
  const manifest = syntheticManifest as EpisodeManifest
  const field = syntheticCurrents as CurrentField
  if (manifest.kind !== 'synthetic') {
    throw new Error('Expected synthetic episode manifest')
  }
  return { manifest, field }
}

export function assertManifestMatchesField(manifest: EpisodeManifest, field: CurrentField): void {
  if (field.timesUtc.length === 0) {
    throw new Error('Current field has no time steps')
  }
  if (field.timesUtc[0] !== manifest.startUtc) {
    throw new Error('Manifest startUtc does not match field')
  }
  const last = field.timesUtc[field.timesUtc.length - 1]
  if (last !== manifest.endUtc) {
    throw new Error('Manifest endUtc does not match field')
  }
}
