# OceanDrift — product brief (demo contract)

**Linear:** MAC-358 · **Repo:** https://github.com/Maciker/ocean-drift  
**UI language for the demo:** English  
**Hackathon framing:** see [hackathon.md](./hackathon.md)

## Problem

Floating litter and debris move with surface currents. Coastal managers, marine protected-area staff, and response planners need a fast, transparent way to explore **where debris released at a known origin might travel over the next 24–72 hours**, using real Copernicus Marine currents — without treating the result as an operational forecast.

## User

**Primary:** regional marine planner / NGO analyst exploring an incident or “what if” release in a Mediterranean coastal region.

**Job:** pick an origin and time, watch particle drift, compare a few explicit sensitivity variants, and see which coastal stretches or protected areas the cloud of trajectories approaches.

## Concrete demo case

| Parameter | Choice (MVP) |
| --- | --- |
| Region | Western Mediterranean coastal box (exact bbox locked with the episode fixture in MAC-361) |
| Phenomenon | Floating debris / litter surface drift (exploratory advection + optional parametrised dispersion) |
| Horizon | 24 / 48 / 72 hours within dataset coverage |
| Data product | MEDSEA_ANALYSISFORECAST_PHY_006_013 — surface currents (`u`/`v`); preferred hourly 2D currents dataset once fixture size is validated |
| Interaction | Map-first: set origin, play / pause / reset / scrub, compare scenarios, inspect exposure candidates |
| Output | Deterministic run JSON + printable HTML summary with parameters, dataset hash, metrics, limitations |

## Two-minute storyboard

1. **Problem (15 s)** — Floating debris; need regional awareness, not beach-level arrival claims.  
2. **Incident (20 s)** — Drop origin on the map; show UTC time and horizon.  
3. **48 h drift (40 s)** — Play particles driven by Copernicus currents (fixture, not live download).  
4. **Sensitivity (25 s)** — Toggle a bounded origin/time or dispersion variant; same data versions.  
5. **Exposure (15 s)** — Highlight coast / protected-area candidates touched by trajectories.  
6. **Limits + next step (15 s)** — State exploratory nature; show export / credit / dataset id.

## Explicit non-goals

- Not an emergency operational system.
- Not a calibrated probability of beaching on a named beach.
- Scenario frequencies ≠ calibrated probabilities.
- No mandatory live Copernicus download during the pitch (preloaded fixture + reproducible offline pipeline).
- Optional AI only to explain already-computed results; deterministic path always available.

## Technical contract (MVP stack)

- TypeScript · React · Vite · MapLibre GL JS · Web Worker for simulation  
- Static hosting compatible with Vercel  
- Workflow inheritance from `Maciker/agent-workflow-code-ts` (MAC-360)  
- Linear = backlog; GitHub = code/docs/PRs (no duplicate GitHub Issues)

## Success for the demo

Clean checkout, reproducible fixture, physics tests on analytic fields, usable map UI, honest limitations, two-minute pitch with real data, adversary review on the final commit.
