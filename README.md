# OceanDrift

Exploratory map for floating-debris surface drift in a Mediterranean region, driven by real [Copernicus Marine](https://marine.copernicus.eu/) currents. Demo UI is in English. This is **not** an operational emergency forecast.

| | |
| --- | --- |
| Linear project | [OceanDrift — Copernicus Marine](https://linear.app/maciker/project/oceandrift-copernicus-marine-8a30dc28bd9c) |
| Hackathon notes | [docs/hackathon.md](docs/hackathon.md) |
| Product brief | [docs/product-brief.md](docs/product-brief.md) |
| Workflow integration | [docs/workflow-integration.md](docs/workflow-integration.md) |

## Stack

- Node **22+**, **pnpm** (see `packageManager` in `package.json`)
- React + Vite + TypeScript (strict)
- MapLibre GL JS (MapLibre demotiles basemap — no API key)
- Agent workflow from [`agent-workflow-code-ts`](https://github.com/Maciker/agent-workflow-code-ts) (pinned in `docs/workflow-provenance.json`)
- Synthetic current-field fixture for engine wiring; real Copernicus fetch blocked without private credentials ([docs/data-pipeline.md](docs/data-pipeline.md))

## Setup

```bash
pnpm install
pnpm setup:hooks   # optional local git hooks
pnpm data:generate-synthetic
pnpm dev
```

## Scripts

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm quality:fast      # typecheck + lint + test
pnpm quality:full      # + arch, knip, jscpd, ratchet
pnpm ai:sync           # regenerate vendor adapters from .ai/
pnpm vendors:check
pnpm dogfood:check
pnpm data:fetch-episode   # requires private Copernicus credentials
pnpm data:build-fixture   # after a successful fetch
```

## Layout

```text
.ai/            canonical agent workflow (do not hand-edit vendor projections)
src/
  domain/       shared types and map defaults
  data/         episode fixtures (later)
  ui/           React app and MapLibre view
  worker/       drift simulation worker (later)
tools/          quality, vendor sync, QA harness
docs/           product + workflow docs
```

## Licence and attribution

- Application code: [MIT](./LICENSE)
- Workflow third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
- Ocean data: [Copernicus Marine Service licence](https://marine.copernicus.eu/user-corner/service-commitments-and-licence); credit required
- Basemap: [MapLibre demotiles](https://demotiles.maplibre.org/)

## Visibility

Repository `Maciker/ocean-drift` is **public**. No secrets in the repo; see `.env.example`.
