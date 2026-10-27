# real/wmed-2024-09-01

Placeholder for the first **real** Copernicus Marine currents episode.

- Product: MEDSEA_ANALYSISFORECAST_PHY_006_013
- Dataset candidate: `cmems_mod_med_phy-cur_anfc_4.2km-2D_PT1H-m`
- Window: 2024-09-01 → +72 h UTC
- BBox: 1.5–6.5 E, 38.5–43.5 N

Fetch is blocked in CI/agent environments without credentials. See `docs/data-pipeline.md` and run `pnpm data:fetch-episode` privately.

Do not commit secrets. Binary NetCDF may be large — prefer committing the compact `currents.json` + `manifest.json` once built, after confirming licence redistribution for the chosen subset size.
