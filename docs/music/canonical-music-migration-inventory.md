# Canonical Music Migration Inventory

Status: `v3_migration_complete`

This inventory records the legacy Music surfaces retained, adapted, migrated, isolated as fixtures or compatibility, and retired through the canonical Music v3 execution-integrity closure. It is implementation evidence, not an Orchestra implementation or a live-provider activation record. Historical v1/v2 decisions remain preserved in `canonical-music-v2-execution-integrity-audit.md` and `adr-0001-canonical-music-v2-versioning-and-boundaries.md`; the current closure authority is `canonical-music-closure-report.md`.

## Canonical baseline

- Branch base: `0eef00d247b040168cf48a8c00a039954fb8595a`.
- Sound dependency: canonical Sound `4.0.0`, contract `sound.skill_contract.v4`.
- Shared kernel: `server/edit-skills/core`.
- Music branch: `codex/canonical-music-skill`.
- Music v1 baseline: `908f0ea327aa9db57367a829ccfb68f7fdea23e1`.
- Music v3 result: skill `3.0.0`, contract `music.skill_contract.v3`.
- Compatible Sound dependency: skill `4.1.0`, contract `sound.skill_contract.v4`.
- Global Orchestra, final mux, render, export, delivery, and publishing remain out of scope.

## Migration map

| Legacy surface | Classification | Canonical treatment |
| --- | --- | --- |
| `server/music/*` and `server/edit-skills/music/*` canonical Music v1 | migrate | Preserve working private analysis, provider, Sound-port, scope, rational timing, registry, and acceptance foundations; publish materially changed v2 identities rather than silently mutating v1 contracts. |
| `src/types/audio-music.ts` | adapt | Preserve useful Music domain vocabulary, but replace execution authority with canonical request/result, rational frames, immutable artifacts, rights, QA, revision, and handoff contracts. |
| `src/backend/contracts/audio-music-contracts.ts` | compatibility_only | Project canonical Music artifacts for old planning callers; it may not admit execution or create a handoff. |
| `src/backend/contracts/sound-music-audio-contracts.ts` | retire | `SOUND_MUSIC_AUDIO` cannot own Music or authorize provider, worker, Sound, or artifact execution. |
| `src/backend/services/music-director-service.ts` | migrate | Move useful supervision ideas into evidence-bound context, need, silence, narrative, cue-density, motif, and continuity directors. |
| `src/backend/services/music-cue-sheet-service.ts` | migrate | Replace fixed/seconds-only cue authority with exact rational frame cue sheets. |
| `src/backend/services/music-policy-service.ts` | adapt | Retain vocal, lyric, speech, culture, and restraint policies; bind them to exact evidence and review states. |
| `src/backend/services/music-style-selector-service.ts` | fixture_only | Keyword, location, and Lake Como mappings remain regression fixtures only and cannot select production Music. |
| `src/backend/services/music-reference-dna-service.ts` and `reference-music-cue-boundary-service.ts` | migrate | Replace metadata-only authority with actual authorized-byte analysis and measured/inferred/declared confidence. |
| `src/backend/services/music-track-analysis-service.ts` | fixture_only | Metadata-estimated BPM, key, loudness, vocals, loopability, and artifact scores cannot qualify real output. |
| `src/backend/services/music-qa-service.ts` | migrate | Preserve categories but require decoded-artifact technical, structural, speech, provenance, continuity, and integration evidence. |
| `src/backend/services/music-mix-planning-service.ts` | adapt | Becomes creative `MusicMixIntentManifest`; technical mutation remains Sound v4-owned. |
| `src/backend/services/music-regeneration-decision-service.ts` | adapt | Preserve localized/lower-cost decisions inside canonical revision and regeneration policy. |
| `src/backend/services/music-library-candidate-service.ts` | adapt | Results must resolve to real immutable authorized project/workspace/internal assets and rights; fake matches are blocked. |
| `src/backend/services/lyria-prompt-service.ts`, `lyria-negative-prompt-service.ts`, and `lyria-prompt-validation-service.ts` | migrate | Compile a server-owned current-provider request from the provider-neutral brief. Legacy Lyria 2 negative-prompt fields are not assumed valid for Lyria 3. |
| `src/backend/providers/lyria/*` | remove_after_migration | Replace the stale Lyria 2/placeholder client family with one current, fail-closed canonical provider adapter and injected transport. |
| `src/backend/workers/lyria-worker-*` | fixture_only | The mock worker and `mock://` outputs remain historical fixtures and cannot dispatch or claim render-ready audio. |
| `src/backend/mock/mock-lyria-*`, `mock-music-*`, and `mock-music-sfx-*` | fixture_only | Retain deterministic scenario concepts only; canonical acceptance uses private real audio bytes and honest fixture qualification. |
| `src/backend/orchestrators/mock-lyria-*` and `mock-music-*` | retire | They cannot be a production Music service or substitute for the future Orchestra. |
| `src/backend/api/routes/music-api-routes.ts` | compatibility_only | UI projection/legacy planning boundary only; canonical execution stays server-owned. |
| `src/components/editor/music/*` | adapt | Convert cards and flow to projections over canonical Music artifacts; remove fake progress and mock QA authority. |
| `src/lib/mock-audio-music-records.ts` | fixture_only | Lake Como, fixed cue timing, mock URLs, and metadata analyses stay explicitly fixture-only. |
| `src/backend/services/storytiming-music-*` | adapt | Retain timing concepts while canonical MusicSync uses shared rational timeline utilities and exact samples/frames. |
| `src/backend/services/storytiming-soundsync-*` | compatibility_only | Historical conflict/QA planning may project into canonical Music and Sound evidence, but cannot own MusicSync. |
| `server/workers/audio/music-*` and `server/workers/audio/soundsync-*` | adapt | Reuse bounded speech/ducking/artifact policy where compatible; Music delegates actual audio mutation through Sound v4. |
| `server/motion-studio/audio/music-foley-*` and `src/lib/motion-studio/contracts/music-foley.ts` | compatibility_only | Peer-shaped fixtures exercise the canonical public Music contract; Motion Studio cannot call Music or Sound tools directly. |
| `server/motion-studio/music-production/lyria-d3-*` | retain | Keep account/readiness evidence independent; it does not activate canonical Music or qualify live Lyria by itself. |
| `server/tool-calling/sound-music-audio-owner-expansion-*` and related docs | fixture_only | Historical ownership evidence only; canonical Music and Sound manifests are authoritative. |
| `server/smoke/sound-music-audio-*` | retire | Replace as canonical acceptance becomes authoritative. |
| `supabase/migrations/202605130009_soundsync_music_intelligence.sql` | fixture_only | Domain inventory only. It is not deployed or copied unchanged; standalone Music uses the shared private artifact foundation. |
| Root and `docs/` Music, Lyria, licensing, QA, SoundSync, and timing documents | retain | Product-history and policy inputs; update closure documentation without treating architecture-only claims as execution evidence. |

## Duplicate authority retired by design

- `SOUND_MUSIC_AUDIO` is not a Music owner.
- SoundSync is not the Music department; MusicSync is an internal Music mini-skill.
- UI state, mock orchestrators, legacy API routes, old workers, and provider aliases cannot admit execution.
- Lake Como and all location-to-genre rules are fixtures, never production reasoning.
- Fixed spacing, fixed duration, seconds-only ranges, first-item selection, metadata-estimated analysis, and `mock://` artifacts cannot authorize or prove execution.

## Provider profile freeze

The official Google documentation checked on 2026-08-04 identifies `lyria-3-pro-preview` and `lyria-3-clip-preview` as public-preview models on the global Interactions API. The canonical implementation will bind an immutable provider profile to the exact current contract and keep live execution fail-closed until account, privacy, retention, commercial, rate, deployment, and private-canary evidence exists.

## Persistence decision

No database migration is required for standalone Music. Canonical Music will use immutable versioned artifacts and approved private media roots. Global work-graph persistence remains future Orchestra work.
