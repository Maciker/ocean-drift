# Static hosting (MAC-369)

## Build

```bash
pnpm install --frozen-lockfile
pnpm build
```

Output: `dist/` (Vite). SPA fallback is configured in `vercel.json` (`rewrites` → `index.html`).

## Payload budget (current)

| Asset class | Approx. size (gzip noted in build) | Notes |
| --- | --- | --- |
| JS bundle | ~1.3 MB raw / ~349 kB gzip | Dominated by MapLibre |
| CSS | ~75 kB / ~12 kB gzip | Includes MapLibre CSS |
| Worker | ~4 kB | Drift engine |
| Synthetic currents JSON | bundled via import | Labeled demo fixture |

No Copernicus credentials or server secrets are required for the static demo. Map tiles load from MapLibre demotiles (network). Offline fallback: `pnpm preview` after `pnpm build`, or `pnpm dev` with cached demotiles if previously loaded.

## Why Vercel (not GitHub Pages alone)

OceanDrift is a Vite SPA with client-side routing and long-cache hashed assets. `vercel.json` already sets SPA fallbacks, immutable `/assets/*` caching, and documents `pnpm build` output (`dist/`). Vercel matches the owner’s usual workflow and picks up that file on import. GitHub Pages would need an extra workflow and similar rewrite rules; it is a valid fallback but redundant when `vercel.json` is the source of truth.

## Preview / production

1. Link the GitHub repo `Maciker/ocean-drift` to a Vercel project (framework Vite, Node 22).
2. Preview deploys from non-`main` branches; production from `main` when promoted intentionally.
3. Before making a deployment **publicly** reachable, confirm Vercel Deployment Protection / auth settings match intent (do not assume tokens or SSO are available to reviewers).
4. Smoke on the preview URL: synthetic banner → origin → Run → scrub/compare → exposure → JSON/HTML export. No live Copernicus calls.

## Verify locally (reproducible)

```bash
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
pnpm preview   # optional manual check at http://127.0.0.1:4173
pnpm test:e2e  # Playwright smoke against the built preview (no secrets)
```

What the smoke test checks:

- Synthetic honesty banner and bundled fixture (no `copernicusmarine.eu` network calls).
- Map load, origin pick, drift run, scrub, compare, exposure ranking, JSON export.
- Narrow viewport still shows the control panel.

CI runs the same `quality:fast` + `build` + `test:e2e` sequence on every push/PR (see `.github/workflows/ci.yml`).

## Rollback

- Vercel dashboard → Deployments → promote a previous successful production deployment, **or**
- `vercel rollback` (CLI) on the project scope after auth
- Local offline demo remains available via `pnpm build && pnpm preview`

## Recorded deployment

Fill when a real preview/production URL exists:

| Field | Value |
| --- | --- |
| SHA | _update after merge / deploy_ |
| Preview / prod URL | _blocked — Vercel project create returned 403 for the agent token; Iker must create/link `ocean-drift` under team `macikers-projects` and paste the URL_ |
| Visibility | Confirm Deployment Protection before sharing publicly |

Local verification already done: `pnpm build` succeeds; SPA assets land in `dist/`.
