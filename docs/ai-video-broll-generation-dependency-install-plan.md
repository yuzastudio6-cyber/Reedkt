# AI Video B-roll Generation Dependency Install Plan

Status: `ai_video_broll_gen_3_dependency_install_plan_no_execution`

Decision: `ai_video_broll_gen_3_dependency_install_plan_completed_ready_for_runtime_gpu_owner_review`

This Gate 3 packet plans future dependencies for AI video B-roll generation. It does not install packages, modify lockfiles, create virtual environments, download model weights, import model code, run inference, generate video, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source-Of-Truth Inputs

- `docs/ai-video-broll-generation-license-provenance-approval.md`
- `docs/ai-video-broll-generation-weight-source-checksum-plan.md`
- `docs/ai-video-broll-generation-weight-source-manifest-plan.md`
- `docs/ai-video-broll-generation-checksum-private-cache-policy.md`
- `docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md`
- `model-routing-policy.md`
- `render-strategy-planner.md`
- `tool-strategy-planner.md`

## External Dependency Evidence

| Candidate | Evidence URL | Gate 3 finding |
| --- | --- | --- |
| Wan / Wan2.1 Diffusers | https://huggingface.co/docs/diffusers/en/api/pipelines/wan | Diffusers supports Wan2.1 1.3B and 14B lanes; source notes memory-focused usage for Wan models. |
| Wan / Wan2.1 source repo | https://github.com/Wan-Video/Wan2.1 | Official repo remains source evidence for model-specific runtime and requirements review. |
| LTX / LTX-Video Diffusers | https://github.com/huggingface/diffusers/blob/main/docs/source/en/api/pipelines/ltx_video.md | Diffusers LTX path is the preferred fast-preview dependency planning lane. |
| LTX / LTX-2 docs | https://docs.ltx.video/open-source-model/integration-tools/pytorch-api | Newer LTX lanes require exact version review, Python/CUDA/PyTorch compatibility, and separate install planning. |
| Mochi 1 | https://github.com/genmoai/mochi | Official repo uses a uv-style Python project and notes FFmpeg is needed only for output video handling; FFmpeg remains blocked until media/render owners accept it. |

## Dependency Strategy

| Priority | Candidate | Dependency lane | Cost posture | Gate 3 decision |
| --- | --- | --- | --- | --- |
| 1 | Wan / Wan2.1 T2V 1.3B | Python virtual environment, PyTorch, diffusers-compatible path first | Most cost-friendly primary lane to validate later | Plan accepted; no install. |
| 2 | LTX / LTX-Video | Python virtual environment, PyTorch, diffusers-compatible path first | Fast-preview and lower-latency lane | Plan accepted with exact version split; no install. |
| 3 | Wan / Wan2.1 14B lanes | Python virtual environment, PyTorch, diffusers or official repo path after GPU review | Higher quality, higher VRAM/cost | Deferred to runtime GPU owner review; no install. |
| 4 | Mochi 1 | Python virtual environment with uv-style project planning | Heavy fallback/research lane | Plan accepted as research only; no install. |
| Blocked | HunyuanVideo | No dependency lane selected | Premium legal-gated | Blocked. |

## Shared Dependency Plan

- Python runtime: plan for Python 3.10 or newer, exact version pinned by future runtime owner.
- Isolation: plan a future private virtual environment outside tracked source.
- PyTorch: plan an owner-approved CUDA build only after GPU/runtime review.
- Diffusers: preferred shared path for Wan and LTX to reduce duplicate runtime surfaces.
- Official repository path: allowed for model-specific proofs only if Diffusers path is insufficient and owner-approved.
- FFmpeg/ffprobe: not installed or run by this lane; Track A/Track B own media processing and final export.
- CUDA, cuDNN, xFormers, FlashAttention, Triton, torchao, and quantization packages: future owner-reviewed only.
- ComfyUI packs and third-party runtime bundles: blocked unless separately approved.

## CPU / GPU Boundary

- CPU is allowed for text diagnostics, static validation, manifest checks, and docs.
- CPU is not an approved inference target for AI video generation.
- Small preview GPU lane should start with Wan 1.3B or LTX fast-preview planning.
- Mid/high GPU lanes must be reviewed before Wan 14B, LTX larger/newer lanes, or Mochi.
- Cloud GPU, local GPU, and hybrid worker placement are deferred to runtime owner review.

## No-Scope Statement

No dependency is installed. No model weights are downloaded. No checksum is computed. No model import is attempted. No inference is run. No generated video is created. No Docker container is built or started. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-4: runtime GPU owner review`
