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

## Preview / production

1. Link the GitHub repo `Maciker/ocean-drift` to a Vercel project (framework Vite, Node 22).
2. Preview deploys from non-`main` branches; production from `main` when promoted intentionally.
3. Before making a deployment **publicly** reachable, confirm Vercel Deployment Protection / auth settings match intent (do not assume tokens or SSO are available to reviewers).
4. Smoke on the preview URL: synthetic banner → origin → Run → scrub/compare → exposure → JSON/HTML export. No live Copernicus calls.

## Rollback

- Vercel dashboard → Deployments → promote a previous successful production deployment, **or**
- `vercel rollback` (CLI) on the project scope after auth
- Local offline demo remains available via `pnpm build && pnpm preview`

## Recorded deployment

Fill when a real preview/production URL exists:

| Field | Value |
| --- | --- |
| SHA | `de8eeb6` (hosting config commit; update after merge) |
| Preview / prod URL | _blocked — Vercel project create returned 403 for the agent token; Iker must create/link `ocean-drift` under team `macikers-projects` and paste the URL_ |
| Visibility | Confirm Deployment Protection before sharing publicly |

Local verification already done: `pnpm build` succeeds; SPA assets land in `dist/`.
