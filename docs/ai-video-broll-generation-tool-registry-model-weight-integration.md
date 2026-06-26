# AI Video B-roll Tool Registry And Model Weight Integration

## Status

Decision: `ai_video_broll_tool_registry_model_weight_integration_ready_with_runtime_blockers`

This packet integrates the open-source AI B-roll model lane into the server-side production tool registry and GPU model-weight readiness metadata. It does not download weights, install model repositories, run imports, instantiate pipelines, run inference, create generated video, create assets, call providers, dispatch workers, touch Supabase, run SQL, mutate GCP, unlock beta, or claim runtime readiness.

## Model Lane

- Primary: Wan / Wan2.1 for realistic stock-style B-roll and generated filler.
- Secondary: LTX-Video for fast preview, image-to-video, keyframe, and motion-graphics-adjacent workflows.
- Fallback/research: Mochi 1 for permissive-license comparison and LoRA/research planning.
- Optional premium gated: HunyuanVideo, blocked until legal, territory, commercial, GPU, billing, and owner review.

## Registry Surfaces

- `wan_video`, `ltx_video`, `mochi_video`, and `hunyuan_video` are production tool IDs under category `ai_video_generation`.
- Every profile is worker-owned metadata using `gpu_ai_worker`; no frontend tool union is expanded.
- Every profile requires model-weight or legal review before production use.
- HunyuanVideo is explicitly blocked rather than silently omitted, preventing accidental fallback routing.

## Model Weight Templates

- `wan_video_model`
- `ltx_video_model`
- `mochi_video_model`
- `hunyuan_video_model`

All templates point to placeholder private worker paths under `/opt/reeditpro/model-weights/ai-video-broll/`, require exact source/revision/checksum review, and block production while unreviewed. No checkpoint or model file is included in the repo.

## Runtime Gates

- modelWeightsDownloaded: false
- modelImportsRun: false
- modelInferenceRun: false
- generatedVideoCreated: false
- generatedAssetsCreated: false
- providerCallsMade: false
- workersDispatched: false
- supabaseTouched: false
- sqlExecuted: false
- gcpMutationCreated: false
- dockerRun: false
- betaUnlocked: false
- productionUnlocked: false

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-1: owner review AI B-roll registry and model-weight readiness, no inference`
