# SOUND_MUSIC_AUDIO Workstream

## Status

- Current status: mock/planning-ready; production execution blocked.
- SOUND-0 completed: repo/Supabase read-only audit.
- Current phase: source-of-truth alignment.
- Production/beta unlock: not owned and not allowed from this workstream.

## Owned capabilities

- Sound effects.
- Ambient audio.
- Ambient sound design.
- Music cue planning.
- Music generation planning.
- Soundtrack layers.
- Audio beds.
- Transition sounds.
- Whooshes.
- Hits.
- Risers.
- Ambience matching.
- Audio mood design.
- Open-source audio/music/SFX tool evaluation.
- Audio asset planning.
- Private audio artifact manifests.
- Timing-aware sound cue planning.
- SoundSync cue manifests.
- Audio-specific QA evidence for handoff.

## Explicitly not owned

- Final Track A render/export validation.
- Final mux/export/delivery validation.
- Visual graphics tools.
- Map/geospatial stack.
- General Track B media/video/image processing.
- General Track B audio processing unless explicitly handed off.
- Provider gateway/fallback/transport/secrets unless explicitly approved later.
- Raw worker execution from chat prompts.
- Worker dispatch/runtime infrastructure.
- Supabase staging/production mutation.
- Supabase migrations unless explicitly approved by `SUPABASE_RLS_STORAGE_DATABASE`.
- Billing/Stripe/payment operations.
- Production/beta unlock.

## Related workstreams

- `AI_TOOLS_CREATIVE_GRAPHICS`
- `TRACK_A_RENDER_EXPORT`
- `TRACK_B_MEDIA_PROCESSING`
- `PROVIDER_GATEWAY_MODELS`
- `WORKER_RUNTIME_JOBS`
- `SUPABASE_RLS_STORAGE_DATABASE`
- `OBSERVABILITY_AUDIT_COST`
- `BILLING_STRIPE_CREDITS`

## Source-of-truth docs

- `production-readiness-review.md`: controls overall production-readiness blockers, launch guardrails, and worker-only tool candidate status. SOUND consumes it as the global production boundary; implementation status is planning-only/blocked for real execution.
- `docs/production-milestone-index.md`: controls milestone sequencing and acceptance boundaries. SOUND consumes it for Milestone 9 and Milestone 15A scope; implementation status is source-of-truth index, with production execution still blocked until later readiness approval.
- `docs/production-audio-sound-foundation.md`: controls Milestone 9 audio cleanup, loudness, music/speech, SoundSync planning, private artifacts, and audio QA gate foundation. SOUND owns the creative/audio planning interpretation and consumes upstream media, speech, and timeline artifacts; implementation status is planning/mock-safe foundation.
- `docs/production-real-audio-execution.md`: controls Milestone 15A server-only audio execution planning, optional local-dev FFmpeg loudness/normalization, private audio artifacts, and QA gates. SOUND consumes and hands off this boundary to Track B/worker runtime for real processing; implementation status is controlled scaffold/fail-closed for production.
- `docs/production-soundsync-foundation-policy.md`: controls SoundSync timing cue metadata and disallows claimed beat detection, generation, provider calls, and final mixing in Milestone 9. SOUND owns cue-manifest planning; implementation status is metadata-only/planning-ready.
- `docs/production-audio-artifact-policy.md`: controls private audio artifact reference rules and source immutability. SOUND consumes it when defining private audio artifact manifests; implementation status is policy-ready, with real storage writes blocked until approved backend/storage work.
- `docs/production-audio-qa-policy.md`: controls audio QA gates for loudness, sync, naturalness, and music-over-voice. SOUND owns audio-specific QA evidence definitions and hands blocking/warning results to render/export and observability workstreams; implementation status is planning/QA-record foundation.
- `docs/google-cloud-audio-worker-plan.md`: controls future Google Cloud runtime shape for Lyria/SoundSync music generation workers. SOUND consumes it for music handoff contracts; implementation status is mock-only/future worker plan.
- `docs/google-cloud-sfx-worker-plan.md`: controls future Google Cloud runtime shape for SFX generation workers. SOUND consumes it for SFX handoff contracts; implementation status is mock-only/future worker plan.

## Existing implementation surfaces

- `server/workers/audio/*`: partially implemented server-side audio foundation and execution scaffolds; mock-safe/fail-closed; SOUND-owned for audio plan/artifact/QA semantics and consumed by Track B/Worker Runtime for future execution.
- `server/workers/audio-execution/*`: partially implemented controlled audio execution pipeline; fail-closed for production; consumed by SOUND and handed off to Track B/Worker Runtime before real execution.
- `src/backend/services/sfx-*`: implemented mock/planning SFX Director, routing, prompt, trim, mix, QA, reuse, and library services; SOUND-owned; real generation/provider transport remains blocked.
- `src/backend/workers/sfx-*`: implemented mock-only SFX worker contracts, validation, events, provider routing, and skeleton runtime; SOUND-owned for creative SFX flow and consumed by Worker Runtime/Provider Gateway for future real execution.
- `src/backend/services/music-*`: implemented mock/planning music director, cue sheet, prompt, mix, QA, track analysis, regeneration, and library services; SOUND-owned; real generation/provider transport remains blocked.
- `src/backend/workers/lyria-*`: implemented mock-only Lyria worker contracts, validation, events, and skeleton runtime; SOUND-owned for music workflow semantics and consumed by Worker Runtime/Provider Gateway for future real execution.
- `src/backend/providers/lyria/*`: partially implemented mock/default provider adapter with real client placeholder fail-closed; consumed by SOUND, owned for real transport/secrets/fallback by `PROVIDER_GATEWAY_MODELS`.
- `src/backend/providers/sfx/*`: partially implemented mock/default Mirelo/MMAudio/internal-library adapter with real client placeholders fail-closed; consumed by SOUND, owned for real transport/secrets/fallback by `PROVIDER_GATEWAY_MODELS`.
- `src/components/editor/sfx/*`: implemented chat-native SFX planning UI cards; SOUND-owned for planning display; no real provider, storage, or worker execution implied.
- `src/components/editor/music/*`: implemented chat-native music planning UI cards; SOUND-owned for planning display; no real provider, storage, or worker execution implied.
- `InlineAudioPipelineCard`: implemented/consumed planning UI surface for audio pipeline status; SOUND-owned for audio readiness display, with execution owned by backend worker boundaries.
- `InlineSoundSyncTransitionTimingCard`: implemented/consumed planning UI surface for SoundSync/transition timing; SOUND-owned for cue/timing semantics, with final render timing consumed by Track A.

## Tool/readiness status

Existing production registry audio-capable tool IDs:

- `ffmpeg`
- `ffprobe`
- `audioflux`
- `signalsmith_stretch`
- `deepfilternet`
- `rnnoise`
- `demucs`
- `soundtouch`
- `rubber_band`
- `essentia`

Missing explicit registry-governed SOUND tools:

- SFX Director tool.
- Music cue planner.
- Ambient sound planner.
- SoundSync planner.
- Audio QA tool.
- Private audio artifact manifest builder.
- Timing-aware cue manifest builder.
- `action_foley_sfx_tool`.
- `ambient_everyday_soundscape_tool`.

Missing tools must not be created in SOUND-1A. Tool registry implementation belongs to a later SOUND prompt. Live `tool_capabilities` mutation belongs to `SUPABASE_RLS_STORAGE_DATABASE` or an explicitly approved Supabase prompt.

## Provider/model status

- Lyria: mock/default, real client placeholder only, fail-closed.
- Mirelo SFX: mock/default, real client placeholder only, fail-closed.
- MMAudio: mock/default, real client placeholder only, fail-closed.
- AudioFlux: open-source analysis candidate, not a generation provider.
- Signalsmith Stretch: open-source stretch/pitch candidate, not a generation provider.
- DeepFilterNet/RNNoise/Demucs: cleanup/separation candidates requiring model/license/readiness review.

Provider/model references not found locally in SOUND-0:

- Dasheng-AudioGen.
- Stable Audio Open.
- Stable Audio 3 Small SFX.
- OpenMOSS MOSS-SoundEffect.
- Meta AudioGen / AudioCraft.
- Woosh.
- TangoFlux.
- ElevenLabs.

No provider can be enabled from this doc. No provider fallback can be added from this doc. Provider transport, secrets, and fallback belong to `PROVIDER_GATEWAY_MODELS`. Commercial/export model eligibility requires compliance/license evidence.

## Worker/runtime boundary

- Workers must execute approved plan snapshots and private artifact scopes only.
- Raw chat must never become a worker execution plan.
- Workers require approved snapshot references and idempotency keys.
- Signed URLs, service-role keys, provider keys, raw prompts, and secret values must be rejected from worker execution payloads.
- SOUND can produce cue manifests and private audio artifact readiness evidence.
- `WORKER_RUNTIME_JOBS` owns job claim, leases, dispatch, runtime configs, Cloud Run deployment, retries, and worker orchestration infrastructure.
- `TRACK_A_RENDER_EXPORT` owns final mux/export/delivery validation.

## Supabase boundary

- Active Supabase project from SOUND-0: `Reeditpro` / `wmyyttnynmteqgcdishd`.
- Supabase mutation is not allowed from SOUND unless explicitly approved by `SUPABASE_RLS_STORAGE_DATABASE`.
- Live feature gates are fail-closed according to SOUND-0.
- Live `worker_runtime_configs` has zero rows according to SOUND-0.
- Provider/model rows for new SOUND tools are not live according to SOUND-0.
- A migration ledger/local mismatch exists around `202605190001`.
- Supabase reconciliation is required before any SOUND database-facing milestone.
- Do not include secrets, connection strings, service-role keys, or signed URLs in SOUND docs or payloads.

## Blocked uses

- Real Lyria API calls.
- Real Mirelo API calls.
- Real MMAudio API calls.
- Dasheng/OpenMOSS/Stable Audio model downloads or execution.
- Provider secrets in frontend or repo.
- Model downloads.
- Production SFX/music generation.
- Production audio cleanup/separation.
- Final audio mux/export.
- Public artifact publishing.
- Supabase migrations or seed changes.
- Cloud Run/GCP deployment.
- Worker runtime config mutation.
- Staging/beta/production unlock.
- Paid production unlock.

## Handoff contracts

- Private audio artifact manifest: consumed by `TRACK_A_RENDER_EXPORT`, `TRACK_B_MEDIA_PROCESSING`, `WORKER_RUNTIME_JOBS`, and `SUPABASE_RLS_STORAGE_DATABASE`.
- Timing-aware cue manifest: consumed by `TRACK_A_RENDER_EXPORT`, `TRACK_B_MEDIA_PROCESSING`, and `WORKER_RUNTIME_JOBS`.
- Audio readiness status: consumed by `TRACK_A_RENDER_EXPORT`, `WORKER_RUNTIME_JOBS`, and `OBSERVABILITY_AUDIT_COST`.
- Blocked uses: consumed by all related workstreams before implementation, runtime, provider, database, or launch work.
- Required QA evidence: consumed by `TRACK_A_RENDER_EXPORT`, `TRACK_B_MEDIA_PROCESSING`, `WORKER_RUNTIME_JOBS`, and `OBSERVABILITY_AUDIT_COST`.
- Provider/license readiness evidence: consumed by `PROVIDER_GATEWAY_MODELS`, `WORKER_RUNTIME_JOBS`, and `OBSERVABILITY_AUDIT_COST`.
- Approved plan snapshot references: consumed by `WORKER_RUNTIME_JOBS`, `TRACK_A_RENDER_EXPORT`, `TRACK_B_MEDIA_PROCESSING`, and `SUPABASE_RLS_STORAGE_DATABASE`.
- Track A composition handoff notes: consumed by `TRACK_A_RENDER_EXPORT`.
- Revision/fallback notes: consumed by `TRACK_A_RENDER_EXPORT`, `PROVIDER_GATEWAY_MODELS`, `WORKER_RUNTIME_JOBS`, and `OBSERVABILITY_AUDIT_COST`.

## Duplicate-work prevention

- Do not recreate routes/services/schemas that already exist.
- Do not duplicate provider gateway transport/fallback/secrets.
- Do not duplicate Track A render/export.
- Do not duplicate Track B general media processing.
- Do not duplicate Supabase migration/RLS/storage work.
- Do not duplicate observability/audit/cost infrastructure.
- Do not duplicate billing/Stripe/payment flows.

## Required section for every future SOUND prompt

### Cross-chat ownership check
- Workstream owner: SOUND_MUSIC_AUDIO
- Related workstreams:
  - AI_TOOLS_CREATIVE_GRAPHICS
  - TRACK_A_RENDER_EXPORT
  - TRACK_B_MEDIA_PROCESSING
  - PROVIDER_GATEWAY_MODELS
  - WORKER_RUNTIME_JOBS
  - SUPABASE_RLS_STORAGE_DATABASE
  - OBSERVABILITY_AUDIT_COST
- Explicitly not owned:
  - final render/export validation
  - map/geospatial tools
  - graphic design tools
  - general video/image processing
  - Supabase staging/production mutation
- Integration points:
  - approved plan snapshots
  - timing manifests
  - private audio artifact manifests
  - worker execution contracts
  - Track A final composition handoff
  - QA/revision/fallback
- Duplicate work to avoid:
  - do not recreate routes/services/schemas that already exist
  - do not duplicate provider gateway work
  - do not duplicate Track A render/export work
  - do not duplicate Track B audio/media processing without handoff
- Handoff output:
  - private audio artifact manifest
  - timing-aware cue manifest
  - audio readiness status
  - blocked uses
  - required validation evidence

## Required final response section for every future SOUND prompt

### Cross-chat impact
- Workstream updated:
- Other workstreams affected:
- Contracts changed:
- Handoff needed:
- Duplicate risk:
- Next owner/prompt:

### Supabase update classification
- Supabase update required:
- Supabase update status:
- Supabase environment touched:
- SQL executed:
- Migration deployed:
- Evidence docs:
- Blockers:
- Next Supabase action:

## Current next prompt recommendation

- Next prompt: `SOUND-1B: mock-safe Sound/Music/Audio contracts and registry types only`.
- Scope: define mock-safe SOUND contracts and registry type shapes without real execution, provider calls, Supabase mutation, GCP changes, model downloads, feature-gate changes, or production/beta unlock.
- Files to touch: contract/type/registry files only if explicitly approved in SOUND-1B.
- Files not to touch: runtime provider clients, migrations, Supabase seeds, GCP scripts, final render/export workers, Track B media processing internals, billing/Stripe code, feature gates, and production readiness unlock docs.
- Exit criteria: contracts and registry type shapes are mock-safe, fail-closed, source-of-truth aligned, and ready for later workstream handoff.
