# AI Video B-roll Generation Runtime / GPU Architecture Plan

Status: `ai_video_broll_gen_0_runtime_gpu_plan_no_execution`

Gate 0 creates no runtime. No dependency install, Docker build/run/push, Cloud Run call, GCP API call, Secret Manager call, worker dispatch, provider call, model download, inference, FFmpeg/ffprobe run, media processing, beta unlock, or production unlock occurs.

## CPU Boundary

CPU is not sufficient for real AI video generation except orchestration, text diagnostics, static validation, and metadata-only planning. CPU may validate docs, manifests, and owner gates; it must not run model inference.

## GPU Worker Path

Future generation requires a GPU worker path owned by `WORKER_RUNTIME_JOBS`, `PROVIDER_GATEWAY_MODELS`, and `AI_VIDEO_BROLL_GENERATION`. The worker must require approved plan snapshots, idempotency keys, private artifact scopes, model weight manifests, and no raw prompt execution.

## Local Proof Path

A future local proof may test model import or minimal synthetic generation only after license/provenance approval, weight checksum approval, dependency install approval, GPU runtime owner review, and explicit no-user-media constraints.

## GCP Handoff Placeholder

Cloud Run, GKE, Vertex, Artifact Registry, Secret Manager, service accounts, GPU quotas, and region choices are not owned by Gate 0. Any future cloud path requires GCP owner approval and must not be inferred from this plan.

## VRAM Tiers

- Small/preview tier: candidate for Wan smaller variants or LTX preview, exact VRAM to be proven later.
- Mid tier: candidate for 720p clips, exact model and VRAM to be proven later.
- High tier: candidate for larger Wan, LTX 13B, Mochi, or Hunyuan proofs, exact GPU to be approved later.
- Premium gated tier: HunyuanVideo or other high-cost cinematic benchmarks only after legal/GPU review.

## Fallback Ordering

1. Prefer user-provided B-roll.
2. Use deterministic graphics/cards when generated video is unnecessary.
3. Plan Wan for realistic generated B-roll.
4. Plan LTX for fast preview or keyframe/image-to-video.
5. Keep Mochi as fallback/research.
6. Keep HunyuanVideo optional premium gated.

## Cost / Latency Tracking

Future runtime must record model, duration, resolution, GPU type, queue latency, generation latency, retries, failure category, QA outcome, and credit placeholder evidence before any billing integration.

## Queue / Worker Integration

Queue integration belongs to `WORKER_RUNTIME_JOBS`. No route, job, worker config, Supabase row, or tool capability is created in Gate 0.
