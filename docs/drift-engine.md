# Drift engine (MAC-363)

Deterministic TypeScript surface advection for OceanDrift. UI-agnostic; safe to run in a Web Worker.

## Method

| Item | Choice |
| --- | --- |
| Spatial sample | Bilinear on lon/lat grid; missing/`null` neighbors → sample treated as unavailable |
| Temporal sample | Linear between the bracketing hourly frames |
| Integrator | Forward Euler (default) and midpoint (RK2) |
| Step | Configurable `dtSeconds` (tests use 3600 s to match hourly fields) |
| Geography | Local equirectangular: `dlat = dy / 111_320`, `dlon = dx / (111_320 · cos(lat))` |
| Dispersion | Optional isotropic random walk scaled by `dispersionMps`, driven by a seeded mulberry32 PRNG — **not** a calibrated diffusivity |

Advection and dispersion are separate code paths. No windage, Stokes drift, oil weathering, or beaching physics beyond “contact with null/land cell → stranded”.

## Particle statuses

| Status | Meaning |
| --- | --- |
| `active` | In water with a valid velocity sample |
| `stranded_land` | Next sample hit land/missing — **not** an observed beach arrival |
| `out_of_bounds` | Left the field bbox |
| `ended_time` | Reached the last field timestamp while still active |

## Run metadata

Each run records: engine version, integrator, `dtSeconds`, seed, particle count, origin, horizon, dataset id/hash from the episode manifest.

Invalid configurations throw before producing trajectories (so the UI never receives a silent empty success).
