# TOOL-STUDY-0 SOUND_MUSIC_AUDIO Routing Policy

Decision: `sound_music_audio_tool_study_passed_docs_only`

This routing policy tells future planning phases when to ask `SOUND_MUSIC_AUDIO` for metadata-only capability guidance. It does not authorize execution.

## Route To SOUND_MUSIC_AUDIO For Metadata Planning

- Voice cleanup and denoise planning: `deepfilternet` and FFmpeg loudness-only fallback metadata.
- Loudness, normalization, voice level, and music-over-voice planning: `ffmpeg_ffprobe_audio`, loudness policies, and music ducking QA metadata.
- SoundSync timing, emotional pause, SFX hit, music duck, cue reason, and beat/onset planning: `soundsync_cue_planning` and future `audioflux` benchmark metadata.
- Music-bed fit and moderate stretch/pitch planning: `signalsmith_stretch` metadata.
- Source separation/stem planning: `demucs` only as blocked review metadata until provenance/legal/human approval.
- Generated music planning: `lyria_music_planning` mock/provider-contract metadata only.
- SFX provider planning: `mirelo_sfx_v1_5`, `mmaudio_v2`, internal library, trim/hit/mix/QA metadata.
- Audio cost/capacity planning and owner handoff metadata.

## Agent Findings And Edit Intents

Agent findings may recommend audio capabilities only as structured metadata:

- `soundNeed`: why the edit benefits from cleanup, ducking, SFX, music, or SoundSync timing.
- `sourceEvidenceRefs`: private refs, timing refs, QA refs, manifest ids, checksums, or post-merge report refs.
- `blockedFlags`: every execution flag remains false.
- `ownerWorkstream`: `SOUND_MUSIC_AUDIO` or the correct handoff owner.

Edit intents may request audio capabilities only after they are compiled into approved planning fields. Raw chat or raw prompts cannot route directly to workers, tools, providers, or SFX/music generation.

## Approved Plan Snapshot Requirements

Future approved plan snapshots must include:

- approved snapshot ref and immutable plan version
- audio capability id and owner workstream
- private source audio/media refs and checksums
- timing refs and frame/time base where relevant
- artifact scope and retention policy
- credit/cost estimate refs when generation or processing may happen later
- QA gate refs for loudness, naturalness, music-over-voice, sync, provenance, and artifact safety
- `routeExecutionAllowed: false` until a separate route/tool execution approval exists
- `runtimeExecutionAllowed: false` until a separate worker/runtime execution approval exists
- `providerExecutionAllowed: false` until a separate provider approval exists

## Fail-Closed Routing

If multiple audio tools could apply, choose the least-executing path:

1. no audio change if sound does not improve the edit
2. metadata-only QA or owner review
3. FFmpeg loudness-only planning for level issues
4. DeepFilterNet planning only when speech cleanup is justified
5. music ducking or music edit before source separation
6. Demucs review only when stems are truly needed and approval evidence exists
7. provider generation only in a later provider/worker phase

Fail closed when source refs are not private, the plan lacks approval refs, the request is broad/arbitrary media, Demucs provenance is missing, a signed URL is proposed as source of truth, or any runtime flag is true.

## Hand Off Instead Of Owning

- Route OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, Polars, PaddleOCR, and PaddlePaddle to `TRACK_B_MEDIA_PROCESSING`.
- Route creative/image generation and graphics execution to `AI_TOOLS_CREATIVE_GRAPHICS`.
- Route final render/export, muxing, delivery packaging, and Track A runtime to `TRACK_A_RENDER_EXPORT`.
- Route worker/job execution to `WORKER_RUNTIME_JOBS`.
- Route provider/model calls to `PROVIDER_GATEWAY`.
- Route Supabase writes, schema, RLS, SQL, and source-of-truth mutation to `SUPABASE_RLS_STORAGE_DATABASE`.
- Route public artifacts and signed URL delivery to `PUBLIC_ARTIFACT_DELIVERY`.

## Required Runtime Flags

Every routed object from this study must preserve:

```json
{
  "routeExecutionAllowed": false,
  "runtimeExecutionAllowed": false,
  "workerExecutionAllowed": false,
  "providerExecutionAllowed": false,
  "toolExecutionAllowed": false,
  "audioProcessingAllowed": false,
  "mediaProcessingAllowed": false,
  "supabaseWritesAllowed": false,
  "publicArtifactsAllowed": false,
  "signedUrlsAsSourceOfTruthAllowed": false,
  "dependencyMutationAllowed": false,
  "rawPromptExecutionAllowed": false
}
```

## Source-Of-Truth Policy

- Source of truth must be private metadata: approved snapshot refs, private audio/media refs, manifest ids, checksums, owner ids, route/capability refs, and future Supabase row refs only after separate Supabase write approval.
- Signed URLs are never source of truth.
- Public artifacts are blocked.
- Raw prompts are not source of truth for tools, workers, routes, providers, audio processing, or media processing.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, audio processing, media processing, browser capture, map rendering, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
