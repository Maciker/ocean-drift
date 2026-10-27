# Copernicus Marine Service Hackathon 2026 — verified rules

**Consultation date:** 28 October 2026 (Europe/Madrid, CEST/CET).  
**Purpose:** gate for OceanDrift (Linear MAC-358). Distinguish confirmed facts from unknowns. Do not infer rules from other Ultrahack events.

## Official sources consulted

| Source | URL | Notes |
| --- | --- | --- |
| Event page (Copernicus) | https://events.marine.copernicus.eu/copernicus-marine-service-hackathon-2026 | Dates, challenge framing, partners |
| Themes | https://events.marine.copernicus.eu/copernicus-marine-service-hackathon-2026/content/themes | Six thematic approaches |
| Ultrahack challenge page | https://new.ultrahack.org/hackathons/copernicus-marine-service-hackathon-2026 | Registration status, location, deadlines, contact |
| Ultrahack FAQ | https://new.ultrahack.org/faq | Prior work, eligibility defaults, submission timing |
| Ultrahack home (pre-hack model) | https://new.ultrahack.org/ | Explicitly invites existing projects + pre-event development |
| Product candidate | https://data.marine.copernicus.eu/product/MEDSEA_ANALYSISFORECAST_PHY_006_013/services | Mediterranean currents datasets |
| CMEMS licence | https://marine.copernicus.eu/user-corner/service-commitments-and-licence | Free perpetual licence; mandatory credit |

Contact listed on the Ultrahack page: `madde.kivikangas@ultrahack.org`.  
General Ultrahack contact (FAQ): `info@ultrahack.org`.

## Confirmed

| Topic | Evidence |
| --- | --- |
| Event dates | 29–31 October 2026 |
| Format | Fully **online** (Ultrahack page: Location Online) |
| Registration deadline | 11 October 2026; page now shows **REGISTRATION CLOSED** |
| Challenge | Single challenge with six thematic approaches aligned with the European Ocean Pact |
| Primary theme fit for OceanDrift | **Protecting and Restoring Ocean Health** (pollution / monitoring / recovery) |
| Audience | Developers, researchers, designers, innovators; oceanography background not required |
| Cost | Free (Ultrahack FAQ) |
| Prior / pre-event work | Ultrahack FAQ: *“When can I start working? Now… except if clearly specified ‘fresh code policy’”*. No fresh-code policy found on the Copernicus Ultrahack page. Pre-hackathon model invites applying with an existing project and continuing development before the event. |
| During the hack | FAQ: submit pitch & code by the deadline; no late submissions; attend sessions/checkpoints |
| IPR | Team owns IPR created; partners may have right of first refusal if selling IPR |
| Prizes (public marketing) | €3,000 pool among top teams; one nominated team for A’Pelago accelerator consideration (LinkedIn / Ultrahack marketing; not a substitute for the official judging pack) |
| Copernicus data licence | Free, worldwide, non-exclusive, perpetual; redistribution and derivative works allowed; **must credit** Copernicus Marine Service (recommended form on product/home page) |

## Unknown / not confirmed on public pages

Mark these as **unknown** until organizers confirm. Do not treat other Ultrahack editions as binding.

- Exact pitch / code deliverable schema (video length, repo URL fields, deck format, judge rubric).
- Whether OceanDrift / Maciker is already accepted as a registered submission after the closed deadline.
- Team size minimums or identity/tax steps beyond the generic FAQ prize note.
- Whether a private judging portal adds constraints beyond public FAQ text.
- Exact end-of-hack submission timezone if not restated in the onboarding package.
- Any sponsor-specific NDAs or demo hosting requirements inside the onboarding pack (not public).

## Draft organizer questions (do not send without authorization)

Prepared for `madde.kivikangas@ultrahack.org` / Ultrahack support. **Not sent.**

1. Is a team that registered (or intends to participate) still able to update a submission after registration closed on 11 Oct 2026?
2. What exact artifacts are required by the final deadline (pitch video length, deck, public demo URL, source repo visibility, written summary)?
3. Confirm there is **no** fresh-code / greenfield-only policy for this edition (public FAQ allows prior work; we want event-specific confirmation).
4. Deadline timestamp and timezone for pitch & code.
5. Required Copernicus Marine credit placement for a static web demo.

## What may proceed before the event

Given public Ultrahack policy (prior work allowed; no fresh-code flag on this challenge page), the following are treated as **legally/process-safe to execute before 29 Oct 2026**, subject to remaining registration unknowns:

- Repository bootstrap, docs, TypeScript app, MapLibre UI, deterministic drift engine, fixture pipeline from Copernicus products under the CMEMS licence with attribution.
- Hosting previews and demo rehearsals that do not claim official acceptance.
- Exportable run summaries and adversarial validation of the episode.

Still blocked without organizer confirmation: claiming official participation, publishing “submitted to judges” materials, or promising a prize/delivery date.

## Gate decision (MAC-358)

| Decision | Status |
| --- | --- |
| Rules clear enough to start implementation? | **Yes**, for technical MVP work under Ultrahack’s published prior-work stance |
| Remaining risk | Registration/acceptance status after closed deadline — track with Iker; do not invent eligibility |
| Event dates as task deadlines? | **No** — they are the hackathon window, not automatic Linear due dates |

## Attribution reminder for the demo

Use CMEMS credit in the UI/footer, e.g.:

> Generated using E.U. Copernicus Marine Service Information  
> Product: MEDSEA_ANALYSISFORECAST_PHY_006_013 (dataset DOI/link to be filled when the episode fixture is locked)
