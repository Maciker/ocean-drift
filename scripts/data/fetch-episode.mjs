#!/usr/bin/env node
/**
 * Fetches a real Copernicus Marine currents subset when credentials are present.
 * Exits non-zero with a clear blocker message otherwise (MAC-361).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(root, 'src/data/episodes/real/wmed-2024-09-01')
const rawPath = join(outDir, 'raw-currents.nc')

const datasetId = 'cmems_mod_med_phy-cur_anfc_4.2km-2D_PT1H-m'
const bbox = { west: 1.5, east: 6.5, south: 38.5, north: 43.5 }
const start = '2024-09-01T00:00:00'
const end = '2024-09-04T00:00:00'

function hasCredentials() {
  return Boolean(
    process.env.COPERNICUSMARINE_SERVICE_USERNAME &&
      process.env.COPERNICUSMARINE_SERVICE_PASSWORD,
  )
}

function resolveCli() {
  const probe = spawnSync('copernicusmarine', ['--version'], { encoding: 'utf8' })
  if (probe.status === 0) return 'copernicusmarine'
  return null
}

mkdirSync(outDir, { recursive: true })

if (!hasCredentials()) {
  const blocker = {
    status: 'blocked',
    reason: 'missing_copernicus_credentials',
    requiredEnv: [
      'COPERNICUSMARINE_SERVICE_USERNAME',
      'COPERNICUSMARINE_SERVICE_PASSWORD',
    ],
    nextStep: 'Set credentials in a private shell, then re-run pnpm data:fetch-episode',
    docs: 'docs/data-pipeline.md',
  }
  writeFileSync(join(outDir, 'BLOCKED.json'), `${JSON.stringify(blocker, null, 2)}\n`)
  console.error(JSON.stringify(blocker, null, 2))
  process.exit(2)
}

const cli = resolveCli()
if (!cli) {
  const blocker = {
    status: 'blocked',
    reason: 'missing_copernicusmarine_cli',
    nextStep: 'pipx install copernicusmarine (private env), then re-run',
    docs: 'docs/data-pipeline.md',
  }
  writeFileSync(join(outDir, 'BLOCKED.json'), `${JSON.stringify(blocker, null, 2)}\n`)
  console.error(JSON.stringify(blocker, null, 2))
  process.exit(2)
}

if (existsSync(rawPath)) {
  console.log(JSON.stringify({ status: 'exists', rawPath }, null, 2))
  process.exit(0)
}

const args = [
  'subset',
  '--dataset-id',
  datasetId,
  '--variable',
  'uo',
  '--variable',
  'vo',
  '--minimum-longitude',
  String(bbox.west),
  '--maximum-longitude',
  String(bbox.east),
  '--minimum-latitude',
  String(bbox.south),
  '--maximum-latitude',
  String(bbox.north),
  '--start-datetime',
  start,
  '--end-datetime',
  end,
  '-o',
  outDir,
  '-f',
  'raw-currents.nc',
]

const result = spawnSync(cli, args, { encoding: 'utf8', stdio: 'inherit' })
process.exit(result.status ?? 1)
