# AI Video B-roll Generation Model Selection Decision

Status: `ai_video_broll_gen_0_model_selection_no_execution`

Decision: `ai_video_broll_gen_0_owner_model_selection_plan_completed_with_warnings_ready_for_license_provenance`

No model download, dependency install, inference, generated video, Docker/GCP action, Supabase mutation, SQL, provider call, worker dispatch, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim is made.

## Selection

| Role | Model | Decision |
| --- | --- | --- |
| Primary | Wan / Wan2.1 family | Best first planning lane for realistic stock-style B-roll, establishing shots, environment/product cutaways, and generated filler clips. |
| Secondary | LTX / LTX-Video | Best second lane for fast preview, image-to-video, keyframe, and motion-graphics workflows. |
| Fallback/research | Mochi 1 | Useful permissive/research fallback and LoRA study path after license and runtime review. |
| Optional premium gated | HunyuanVideo | High-end cinematic benchmark only after legal, territory, GPU, commercial, and model-weight review. |

## Rationale

Wan is the primary candidate because the official repository presents a broad video foundation model family with text-to-video and image-to-video support and consumer-GPU-oriented variants. ReEditPro should evaluate it first for realistic B-roll and generated filler, but only after license/provenance, weight source, checksum, and GPU runtime gates.

LTX is secondary because the official repository and model card emphasize real-time or fast generation characteristics, image-to-video workflows, and control workflows. ReEditPro should use it for fast preview and keyframe/motion-graphics planning after license and runtime review.

Mochi 1 remains fallback/research because the official repository describes an Apache-2.0 release and LoRA support, but its runtime and FFmpeg requirements make it unsuitable for Gate 0 execution.

HunyuanVideo remains optional premium gated because the license includes territory and derivative terms requiring legal review. It must not become the default route or a beta-available model from this decision.

## Boundaries

Existing Wan/Hailuo/Veo routing is not modified. Provider Gateway owns hosted provider transport and secrets. Worker Runtime owns dispatch and job execution. Track A owns final render/export. Track B owns general media processing. Supabase owns persistence, storage, migrations, and signed URL policy. Billing owns credits and Stripe.

## Next Prompt

`AI-VIDEO-BROLL-GEN-1: license/provenance approval`
