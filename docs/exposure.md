# Coastal / protected-area exposure (MAC-366)

## Purpose

Turn particle trajectories into a **ranked list of candidate watch zones** for the demo region. This is a surveillance-priority sketch, not risk quantification.

## Data

| Item | Choice |
| --- | --- |
| Fixture | `src/data/exposure/demo-zones.json` |
| CRS | EPSG:4326 |
| License | MIT project-authored illustrative polygons |
| Status | **Not** official MPA / Natura 2000 / WDPA boundaries |

Replace with clipped authenticated WDPA/EEA/national coast layers before any operational claim. Provenance strings surface in the UI and exports.

## Metrics

For each zone and each particle path:

1. **Inside** — any path sample in the polygon (ray casting).
2. **Near** — closest approach ≤ zone `proximityKm` but never inside.
3. **None** — otherwise.

Particles are counted once per zone (inside wins over near). Ranking prefers inside contacts, then inside particle counts, then near-only counts, then smaller minimum distance.

Also report **out-of-domain** particle count from the drift engine status (left the current field).

## Explicit non-claims

- No exact beach arrival time.
- No calibrated environmental or ecological risk.
- Particle fractions are **not** impact probabilities.
- Demo polygon resolution is coarse (~0.2–0.5°).

## Tests

Unit tests cover point-in-polygon / distance helpers and known-geometry scoring (particle forced inside vs outside a square).
