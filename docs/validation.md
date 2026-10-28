# Validation notes (MAC-368)

Evidence for numerical behaviour and demo limits. This document does **not** claim predictive skill against observations.

## Scope split

| Kind | What we validate | What we do **not** claim |
| --- | --- | --- |
| Numerical | Analytic constant-current displacement, land stranding, OOB exit, seed reproducibility, null-hole sampling | Forecast accuracy vs drifters |
| Fixture | Synthetic episode axes/UTC/hash wiring | Equivalence to a live Copernicus download |
| UI / E2E | Origin → worker run → scrub/compare/exposure/export on labeled synthetic data | Operational readiness |

Real Copernicus episode validation remains blocked without private credentials ([docs/data-pipeline.md](./data-pipeline.md)).

## Manual review checklist (synthetic fixture)

| Check | Result |
| --- | --- |
| u/v convention | Oceanographic east/north (m/s) in manifest + engine |
| UTC | ISO timestamps; datetime-local treated as UTC in UI |
| Axes | Lon ascending, lat ascending; bilinear + temporal linear mix |
| Land mask | `null` velocity → sample `missing` → particle `stranded_land` |
| Domain edge | Leaving bbox → `out_of_bounds` |
| Last frame | Samples after last timestamp → `no_time` |

## Automated coverage

- Analytic Euler/RK2 displacement (`test/drift-engine.test.ts`)
- Land wall stranding; seed-stable dispersion
- Adversarial: null hole ≠ zero, post-horizon time reject, OOB status, 256-particle budget (`test/adversarial-drift.test.ts`)
- Playback / origin validation / compare / exposure / export unit tests
- Manual browser E2E on synthetic fixture (playback, compare, exposure, HTML export) — cloud agent VM, MapLibre demotiles, Software WebGL fallback

## Performance snapshot (identified environment)

| Item | Value |
| --- | --- |
| Host | Cursor Cloud Agent Linux VM |
| Browser | Chromium with Software WebGL fallback (no GPU) |
| Demo particle budget | 36 (single) / 24 (compare) |
| Worker 256-particle analytic run | &lt; 5 s wall (unit test gate) |
| UI strategy | GeoJSON source updates — no React node per particle/frame |

Software WebGL is slower than GPU; FPS was not instrumented as a hard gate. Re-measure on a GPU laptop before citing interactive FPS.

## Known errors / assumptions

1. Equirectangular local metres — not a spherical geodesic integrator.
2. No windage, Stokes drift, beaching physics beyond null-cell stranding.
3. Dispersion is seeded isotropic noise — **not** calibrated diffusivity.
4. Exposure polygons are illustrative MIT geometries — **not** WDPA/MPA.
5. Scenario frequencies and particle fractions are **not** impact probabilities.
6. Synthetic currents are labeled and must not be presented as Copernicus downloads.

## Gates

Run on the candidate SHA before calling validation complete:

```bash
pnpm quality:fast
pnpm quality:full   # when time allows
pnpm build
```

Do not fabricate QA review JSON; only record independent QA if the harness actually ran.
