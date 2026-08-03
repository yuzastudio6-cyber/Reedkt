# Canonical Sound audit and migration map

Status: implementation authority for the canonical `sound` skill. This document records the repository audit performed for the Sound capability-manifest migration; it is not a production-readiness claim.

## Current canonical boundaries

- The existing top-level planning catalog is `src/lib/professional-skills/` and its `ProfessionalSkillDefinition` registry. It remains the user-facing skill catalog.
- Approved-plan, work-item, private-artifact, provider, credit, worker, and QA authorities remain in their existing `server/` and `src/backend/` modules. Sound binds to those identities and gates; it does not replace them.
- The repository did not contain a generic, runtime-consumed `SkillCapabilityManifest` or a Head-of-Orchestra capability resolver. The shared framework added under `server/orchestra/` is therefore the smallest server-owned extension of the existing skill catalog.
- The shared `ToolCapabilityManifest` extension under `server/tool-registry/` now adds immutable per-operation contracts, mutable runtime observations, immutable rate snapshots, and per-request admission without replacing the existing production tool registry.
- `server/workers/audio/` and the native audio execution foundations contain reusable bounded processing and private-persistence policies. Canonical Sound reuses their safety model and the private persistence authority, while adding manifest-bound processing of approved project bytes.

## Duplicate and legacy Sound authorities

| Surface | Decision | Canonical boundary |
|---|---|---|
| `SOUND_MUSIC_AUDIO` contracts and planner | Deprecated as a production owner; retained only as a compatibility input/output shape | `sound` manifest + Sound controller |
| Legacy SFX Director, project-SFX planners, fixed scenario fixtures | Retained as tests/fixtures only; not consulted by canonical planning | Sound design director |
| Legacy Mirelo 1.5 mock/provider route | Deprecated compatibility alias; cannot authorize canonical execution | Mirelo SFX 1.6 provider profile and adapter |
| MMAudio automatic fallback assumptions | Disabled for canonical Sound until an explicitly qualified profile and reconciled provider attempt permit it | Manifest attempt policy |
| SoundSync top-level/workstream language | Retained only as an internal timing mini-skill | `sound_sync` mini-skill |
| Combined Music cue selection in Sound | Removed from canonical Sound; legacy planner remains compatibility-only | Separate future Music skill; read-only Music context in Sound |
| Existing audio worker foundations | Retained and adapted | Canonical local Sound processor and existing worker/private-artifact gates |
| Existing provider gateway, credit, approval, work graph, artifact, QA systems | Retained | Sound requests carry and validate their canonical references |

The legacy combined planner is no longer exported from the broad `src/backend/index.ts` barrel. Direct imports remain available only to its compatibility regression fixtures. `adaptLegacySoundInputToCanonicalSeed` removes Music ownership and forces the Head of Orchestra to resolve scope, artifacts, hashes, approvals, credits, and an admitted canonical route.

## Migration rules

1. The only new top-level production authority is skill key `sound`.
2. The Orchestra discovers Sound from the versioned manifest and binds every assignment to the skill version, capability key, manifest schema version, hash, and qualification status.
3. Old callers must enter through the legacy compatibility adapter. The adapter strips Music ownership and never executes providers or workers.
4. The canonical Sound controller accepts only structured visual events, versioned artifacts, exact ranges, and server-owned route profiles. It contains no product-scenario keyword branches or fixed production timestamps.
5. Provider generation prefers preserved source, approved internal library, and project-owned extraction. Mirelo is primary only when generation remains justified and all execution gates pass.
6. Local processing accepts server-resolved paths only in a backend execution package. Durable Sound requests carry storage/artifact references, never local paths, URLs, credentials, executable names, filter graphs, or command arguments.
7. No database migration is required. Current Supabase migration history remains blocked by its documented parallel-foundations baseline.

## Implemented evidence

- 24 immutable tool manifests with operation-level qualification.
- 18 exact Sound route manifests, including all 14 mandatory canonical route keys.
- Head, peer, Sound-controller, and single-operation worker projections.
- Real private local audio analysis/edit/sync/mix/QA evidence, including actual loop-seam crossfades.
- Mirelo 1.6 injected-transport, idempotency, reconciliation, private-ingest, carrier-extraction, cost, and visual-rejection fixture evidence.
- A real-byte local E2E path from Orchestra inspection through Sound, route admission, bounded worker execution, QA, and handoff.
- Focused UI copy that labels Mirelo 1.6 fixture qualification and production blocking honestly.

See `docs/sound/canonical-sound-tool-capability-registry.md`, `docs/sound/canonical-sound-qualification-evidence.md`, and `docs/sound/mirelo-sfx-1.6-provider-profile.md`.

## External activation still required

- Mirelo production qualification requires a configured server secret, approved paid account/commercial terms, privacy and retention approval, private canary evidence, deployment evidence, and live cost evidence. Deterministic injected-transport evidence does not satisfy those gates.
- The local FFmpeg runtime available during development is evidence for private/internal operation behavior only. Its current Homebrew build configuration is not the approved deployable production runtime.
- Public delivery, final mux/render/export, live wallet mutation, provider settlement, and production worker deployment remain owned by their existing systems and are not unlocked by Sound.
