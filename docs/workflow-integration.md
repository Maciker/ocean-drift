# Workflow integration — agent-workflow-code-ts

**Date:** 28 October 2026 (Europe/Madrid)  
**Source:** https://github.com/Maciker/agent-workflow-code-ts  
**Pinned commit:** `dc22a2c42c360b0c9bd3433b2e5c31798ee24ab3` (v0.8.0 tree as cloned)  
**Machine-readable manifest:** [workflow-provenance.json](./workflow-provenance.json)

## Why

MAC-360: OceanDrift inherits the canonical TypeScript agent workflow (skills, vendor adapters, quality gates, pre/post-PR review) without treating generated vendor trees as source.

## What was imported

| Path | Role |
| --- | --- |
| `.ai/` | Canonical agents, commands, skills, policies, templates, MCP |
| `tools/` | Vendor sync, QA, quality ratchet, sandbox, diagnostics |
| `quality/` | Gate config, baselines, profiles, schemas |
| `scripts/`, `.githooks/` | Hook installers |
| `licenses/`, `THIRD_PARTY_NOTICES.md` | Attribution (Matt / Emil / Humanlayer, etc.) |
| Workflow `docs/*` | Preserved beside OceanDrift `hackathon.md` / `product-brief.md` |
| `examples/tasks/*` | Dogfood task fixtures |
| Selected `test/*.test.ts` | Vendor sync, QA, pre/post-PR gates |

Vendor trees (`.cursor/`, `.codex/`, `.agents/`, `.hermes/`, GitHub Copilot projections) are **regenerated** with `pnpm ai:sync`, not copied from upstream.

## Adaptations

- Application remains React + Vite under `src/{domain,data,ui,worker}`.
- `package.json` exposes both app (`dev`/`build`) and workflow (`quality:*`, `ai:sync`, `prepr:gate`, …) scripts.
- `tools/stabilization/dogfood-check.mjs` asserts OceanDrift private package + provenance instead of upstream package version `0.8.0`.
- Skill catalog is complete; Swift/Expo skills are retained for parity but marked not-for-load in `AGENTS.md`.
- QA fixture git helpers and `tools/qa/qa-context.mjs` force `commit.gpgsign=false` / `core.fsmonitor=false` so host agent git config cannot hang gate tests.

## Validation expected on this commit

```bash
pnpm install
pnpm ai:sync
pnpm vendors:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm quality:fast
```

`pnpm quality:full` additionally runs arch / knip / jscpd / ratchet. Cross-model QA and `prepr:gate` require distinct implementer/reviewer identities — **never fabricate** them when providers are unavailable.

## Downstream checklist PR

A separate PR against `Maciker/agent-workflow-code-ts` should add `ocean-drift` to the README “Downstream repositories” table. That PR is not auto-merged.
