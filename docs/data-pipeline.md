# Copernicus episode data pipeline (MAC-361)

## Goal

Produce a **small, traceable surface-current fixture** for Western Mediterranean drift demos: enough numeric `u`/`v` for ≥72 hours of advection, loadable offline by the TypeScript app/worker.

WMTS map tiles are for visualization only — they are **not** used for advection.

## Product and dataset (candidate)

| Field | Value |
| --- | --- |
| Product | [MEDSEA_ANALYSISFORECAST_PHY_006_013](https://data.marine.copernicus.eu/product/MEDSEA_ANALYSISFORECAST_PHY_006_013/services) |
| Preferred dataset | `cmems_mod_med_phy-cur_anfc_4.2km-2D_PT1H-m` (2D hourly currents) |
| Variables | eastward / northward surface velocity (`uo` / `vo` naming as published — verify on download) |
| Units | m/s |
| Time | UTC |
| Depth | surface / top level only |
| Convention | oceanographic: positive `u` east, positive `v` north |

Exact variable names, grid orientation and land mask encoding are recorded in the episode manifest after a successful download.

## Episode selection (planned)

| Parameter | Planned value | Notes |
| --- | --- | --- |
| Region label | Western Mediterranean coastal box | Final bbox locked when real download succeeds |
| BBox (lon/lat) | `1.5E–6.5E`, `38.5N–43.5N` | ~Balearic / Gulf of Lion approach; adjust if payload too large |
| Start (UTC) | `2024-09-01T00:00:00Z` | Historical window with ≥72 h coverage in product temporal extent |
| Horizon | 72 h (hourly steps → 73 frames including t0) | Demo also supports 24/48 within the same fixture |
| Grid | native ~4.2 km | Subsample only if size budget fails |

## Authentication (private)

Copernicus Marine Toolbox credentials **must not** live in the repo or static build.

```bash
# Install toolbox in a private environment (example)
pipx install copernicusmarine
# or: pip install copernicusmarine

export COPERNICUSMARINE_SERVICE_USERNAME=...
export COPERNICUSMARINE_SERVICE_PASSWORD=...
# alternatively: copernicusmarine login
```

Then:

```bash
pnpm data:fetch-episode
pnpm data:build-fixture
```

### Blocker (2026-10-28)

This Cloud Agent environment has **no** Copernicus credentials and no preinstalled `copernicusmarine` CLI. Real NetCDF download is blocked until credentials are provided privately. Until then:

- Use `src/data/episodes/synthetic-steady/` for engine/UI wiring.
- Keep `src/data/episodes/real/` empty of binary payloads; only the manifest template and README remain.

## Output layout

```text
src/data/episodes/<episode-id>/
  manifest.json     # provenance, bbox, times, units, checksums
  currents.json     # compact lon/lat/time grids + u/v (or chunked)
  README.md         # human notes + citation
scripts/data/
  fetch-episode.mjs # wraps Toolbox CLI when available
  build-fixture.mjs # NetCDF → currents.json + checksum
  generate-synthetic.mjs
```

## Licence / credit

Redistribution of Copernicus Marine products is allowed under the [CMEMS licence](https://marine.copernicus.eu/user-corner/service-commitments-and-licence) with mandatory credit. Demo UI already carries the credit line; lock DOIs into `manifest.json` after fetch.

## Size budget

Target: `currents.json` gzip ≤ ~5 MB for the demo path; prefer fewer cells over dropping hours. Measure after first successful fetch and record in the manifest.
