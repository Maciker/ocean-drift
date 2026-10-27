#!/usr/bin/env node
/**
 * Converts a downloaded NetCDF currents file into currents.json + manifest.
 * Requires the `netcdfjs` optional path later; for now validates presence and
 * records a clear next-step when conversion deps are missing.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const episodeDir = join(root, 'src/data/episodes/real/wmed-2024-09-01')
const rawPath = join(episodeDir, 'raw-currents.nc')

if (!existsSync(rawPath)) {
  const message = {
    status: 'blocked',
    reason: 'missing_raw_netcdf',
    expected: rawPath,
    nextStep: 'Run pnpm data:fetch-episode after credentials are available',
  }
  console.error(JSON.stringify(message, null, 2))
  process.exit(2)
}

// Placeholder: real NetCDF→JSON conversion lands once a sample file exists.
// Avoid adding a heavy NetCDF dependency before we can exercise it.
const raw = readFileSync(rawPath)
const sha = createHash('sha256').update(raw).digest('hex')
writeFileSync(
  join(episodeDir, 'PENDING_CONVERSION.json'),
  `${JSON.stringify(
    {
      status: 'pending_conversion',
      rawSha256: sha,
      sizeBytes: raw.length,
      note: 'Implement NetCDF decode → CurrentField once the first subset is on disk',
    },
    null,
    2,
  )}\n`,
)
console.log(JSON.stringify({ status: 'pending_conversion', rawSha256: sha }, null, 2))
process.exit(3)
