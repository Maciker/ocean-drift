# OceanDrift

Exploratory map for floating-debris surface drift in a Mediterranean region, driven by real [Copernicus Marine](https://marine.copernicus.eu/) currents. Demo UI is in English. This is **not** an operational emergency forecast.

| | |
| --- | --- |
| Linear project | [OceanDrift — Copernicus Marine](https://linear.app/maciker/project/oceandrift-copernicus-marine-8a30dc28bd9c) |
| Hackathon notes | [docs/hackathon.md](docs/hackathon.md) |
| Product brief | [docs/product-brief.md](docs/product-brief.md) |

## Stack

- Node **22+**, **pnpm** (see `packageManager` in `package.json`)
- React + Vite + TypeScript (strict)
- MapLibre GL JS (MapLibre demotiles basemap — no API key)
- Planned: Web Worker drift engine, preloaded Copernicus fixtures

## Setup

```bash
pnpm install
pnpm dev
```

Other scripts:

```bash
pnpm typecheck
pnpm build
pnpm preview
pnpm lint
```

## Layout

```text
src/
  domain/   # shared types and map defaults
  data/     # episode fixtures (later)
  ui/       # React app and MapLibre view
  worker/   # drift simulation worker (later)
docs/       # hackathon gate + product brief
```

## Licence and attribution

- Application code: [MIT](./LICENSE)
- Ocean data: use under the [Copernicus Marine Service licence](https://marine.copernicus.eu/user-corner/service-commitments-and-licence); credit required
- Basemap: [MapLibre demotiles](https://demotiles.maplibre.org/)

## Visibility

Repository `Maciker/ocean-drift` is **public** (confirmed via GitHub API on 28 Oct 2026). No secrets in the repo; see `.env.example`.
