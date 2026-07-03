# TOOL-STUDY-0 TRACK_B_MEDIA_PROCESSING Routing Policy

Decision: `track_b_media_processing_tool_study_passed_docs_only`

This routing policy tells future planning phases when to ask Track B for metadata-only media-processing capability guidance. It does not authorize execution.

## Route To Track B For Metadata Planning

- OCR/text-in-frame planning: `paddleocr`, `paddlepaddle`, and optional `opencv` preprocessing metadata.
- Frame/image QA planning: `opencv` and `sharp_libvips` metadata.
- Scene/shot-boundary planning: `pyav` and `pyscenedetect` metadata.
- Video/container metadata planning: `pyav` policy and stream/timecode refs.
- Private derivative policy: `sharp_libvips` and checksum manifests.
- Safe tabular route/cost/readiness summaries: `duckdb` and `polars` planning.
- Track B route/capability manifest metadata and blocked-scope assertions.
- Track B cost/capacity metadata.
- Track B benchmark/sidecar/profiler metadata.

## Hand Off Instead Of Owning

- Route creative graphics, image generation, motion design, cards, charts, and overlays to `AI_TOOLS_CREATIVE_GRAPHICS`.
- Route final render, export, mux/transcode, Remotion render workers, and Track A runtime to `TRACK_A_RENDER_EXPORT`.
- Route DeepFilterNet, Signalsmith Stretch, Demucs, creative audio, music, SFX, and audio runtime decisions to `SOUND_MUSIC_AUDIO`.
- Route provider/model calls to `PROVIDER_GATEWAY_MODELS`.
- Route worker/job execution to `WORKER_RUNTIME_JOBS`.
- Route Supabase writes, schema, RLS, SQL, and milestone row mutation to `SUPABASE_RLS_STORAGE_DATABASE`.

## Required Runtime Flags

Every Track B routed object from this study must preserve:

```json
{
  "routeExecutionAllowed": false,
  "runtimeExecutionAllowed": false,
  "workerExecutionAllowed": false,
  "providerExecutionAllowed": false,
  "toolExecutionAllowed": false,
  "mediaProcessingAllowed": false,
  "supabaseWritesAllowed": false,
  "publicArtifactsAllowed": false,
  "signedUrlsAsSourceOfTruthAllowed": false,
  "dependencyMutationAllowed": false,
  "rawPromptExecutionAllowed": false
}
```

## Source-Of-Truth Policy

- Source of truth must be private metadata: approved snapshot refs, private media refs, manifest ids, checksums, owner ids, route/capability refs, and future Supabase row refs only after a separate Supabase write approval.
- Signed URLs are delivery mechanisms only and are blocked as source of truth.
- Public artifacts are blocked.
- Raw chat or raw prompts are not source of truth for tools or workers.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, media processing, browser capture, Docker or Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
