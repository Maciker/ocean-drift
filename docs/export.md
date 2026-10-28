# Verifiable run export (MAC-367)

## Outputs

| Artifact | Content |
| --- | --- |
| JSON (`schemaVersion` 1.0.0) | Episode id/kind/hash, run parameters, optional compare summary, optional exposure ranking, limitations[] |
| HTML | Deterministic printable page from the same payload — no LLM, no invented figures |

Both are built only from calculated fields already present in the client (`buildRunExport` / `renderExportHtml`).

## Guarantees

- Same inputs → same JSON fields (except `generatedAtUtc` unless injected).
- HTML escaping for all free-text fields.
- Disclaimers always include synthetic-data / sensitivity / non-probability language when applicable.

## Out of scope (for now)

- GIS Report Studio coupling
- Server-side OpenAI narrative (would require a private API route; simulation must not depend on it)
