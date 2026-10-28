# Copernicus delivery checklist (MAC-370)

**Owner:** Iker · **Agent role:** prepare package only — **do not submit or email organizers.**

Consultation baseline: [hackathon.md](./hackathon.md) (28 Oct 2026). Exact pitch schema / deadline timezone remain **unknown** on public pages — confirm in Ultrahack onboarding before final send.

## Artifacts

| Artifact | Location / action | Done? |
| --- | --- | --- |
| Public repo | https://github.com/Maciker/ocean-drift | [x] |
| Pitch script | [pitch-script.md](./pitch-script.md) | [x] |
| Storyboard | [demo-storyboard.md](./demo-storyboard.md) | [x] |
| Architecture / stack | README + [architecture.md](./architecture.md) | [x] |
| Validation evidence | [validation.md](./validation.md) | [x] |
| Sources / licences | README licence section + CMEMS credit in UI | [x] |
| Theme fit | Protecting and Restoring Ocean Health — [hackathon.md](./hackathon.md) | [x] |
| Pitch video (≤2 min) | Record from script; store outside git if large | [ ] |
| Still captures | Banner, trails, compare, exposure | [ ] (agent demos under `/opt/cursor/artifacts/screenshots/`) |
| Preview URL | Blocked on Vercel project create (403) — [hosting.md](./hosting.md) | [ ] |
| Registration / team confirmation | Unknown after registration closed 11 Oct 2026 — Iker verifies | [ ] |
| Final SHA recorded | Fill below after last merge | [ ] |

## Final SHA (fill at submit time)

| Field | Value |
| --- | --- |
| Commit | _pending_ |
| Branch / tag | `main` |
| Demo data | Synthetic labeled fixture (until real episode) |
| Preview URL | _pending_ |

## Pre-submit rehearsal

1. `pnpm install && pnpm quality:fast && pnpm build && pnpm preview`
2. Walk the pitch script once with audio.
3. Confirm synthetic banner is honest (or real episode is loaded and labeled).
4. Export JSON + HTML from a finished run; open HTML offline.
5. Fallback: if preview URL fails, use local preview + screen share.

## Explicit non-claims in materials

- No adoption, revenue, or customer claims.
- No calibrated impact probabilities.
- No scientific certification.

## Organizer contact (do not auto-send)

- `madde.kivikangas@ultrahack.org` / Ultrahack FAQ `info@ultrahack.org`
- Draft questions live in [hackathon.md](./hackathon.md) — send only if Iker authorizes.
