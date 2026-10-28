# OceanDrift demo storyboard (MAC-362)

UI language: **English**. Map is the protagonist.

## Two-minute flow

| Beat | Screen | User action |
| --- | --- | --- |
| 1. Problem (15 s) | Map + synthetic banner + short lede | Read: exploratory surface advection, not a forecast |
| 2. Incident (20 s) | Click sea for origin; set horizon 48 h | Origin marker appears; land clicks rejected |
| 3. Drift (40 s) | Play | Particles/trails advance with UTC scrubber |
| 4. Sensitivity (25 s) | Toggle compare offset (MAC-365) | Side-by-side / dual trails when available |
| 5. Exposure (15 s) | Provenance + legend | Dataset kind, hash, limitations |
| 6. Limits (15 s) | Footer credit | Copernicus / synthetic label; no calibrated probabilities |

## Layout

```text
┌──────────────────────────────────────────────┐
│ Brand + one-line purpose          credits    │
├──────────────┬───────────────────────────────┤
│ Controls     │                               │
│ origin/time  │         Full-bleed map        │
│ horizon      │    origin · trails · particles│
│ play/scrub   │                               │
│ legend       │                               │
│ provenance   │                               │
└──────────────┴───────────────────────────────┘
```

On narrow viewports the control panel stacks under a compact toolbar; the map remains edge-to-edge.

## States

| State | Treatment |
| --- | --- |
| No origin | Hint: “Click the sea to set an origin” |
| Origin on land / missing velocity | Inline error; do not start a run |
| Date outside coverage | Clamp or reject with coverage range shown |
| Computing | Busy status on Run; previous run cancelled |
| Finished | Scrub to end; status “Simulation finished” |
| Synthetic data | Persistent amber banner until a real episode is loaded |
| Map error | Recoverable overlay with retry |

## Accessibility

- Keyboard: Tab through controls; Space toggles play when focused on Play.
- Touch: large hit targets for play/scrub; map tap sets origin.
- `prefers-reduced-motion`: skip particle animation; show final trails/positions only.
- Contrast: seafoam text on deep teal panels; errors use distinct red, not colour-only.

## Non-claims

Do not imply beach-level arrival, calibrated probabilities, or operational readiness. Scenario frequencies ≠ probabilities.
