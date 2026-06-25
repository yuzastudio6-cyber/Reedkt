# AI Video B-roll Generation Runtime / GPU Owner Review

Status: `ai_video_broll_gen_4_runtime_gpu_owner_review_no_execution`

Decision: `conditional_runtime_gpu_acceptance_for_future_dependency_install_proof`

Gate 4 reviews CPU/GPU/runtime placement for the AI video B-roll lane. It conditionally accepts a future controlled dependency install proof, but it does not install dependencies, create virtual environments, download model weights, import models, run inference, generate video, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source-Of-Truth Inputs

- `docs/ai-video-broll-generation-dependency-install-plan.md`
- `docs/ai-video-broll-generation-runtime-dependency-matrix.md`
- `docs/ai-video-broll-generation-python-cuda-compatibility-plan.md`
- `docs/production-gpu-tool-readiness-policy.md`
- `docs/production-model-weight-readiness-plan.md`
- `docs/activation-gcp-staging-command-policy.md`
- `docs/activation-gcp-staging-resource-map.md`
- `docs/activation-phase-39c-sg-cloudrun-l4-cuda-compatibility.md`

## Owner Decision

| Scope | Decision | Allowed future action | Still blocked |
| --- | --- | --- | --- |
| CPU diagnostics | accepted | Text diagnostics, manifest validation, source/license checks | AI video inference on CPU. |
| Local small-preview GPU | conditionally accepted | Future dependency install proof for Wan 1.3B or LTX only, with no weights and no inference | Weight download, model import, generated video. |
| Local/cloud mid-720p GPU | conditionally accepted for planning | Future GPU cost review for Wan 14B/LTX larger lanes | Install, weight download, import, inference, user media. |
| High-research GPU | planning only | Mochi research cost envelope | Default product route, beta route, production route. |
| Premium gated GPU | blocked | None for Hunyuan until legal/territory review | Hunyuan dependencies, weights, runtime, beta. |
| GCP/Cloud Run GPU | handoff only | Future owner-reviewed plan using private jobs only | GCP API calls, Cloud Run jobs, Docker builds, public endpoints. |

## Cost-Friendly Ranking

1. Wan / Wan2.1 T2V 1.3B for primary realistic B-roll proof planning.
2. LTX / LTX-Video for fast preview and image-to-video planning.
3. Wan / Wan2.1 14B lanes for quality only after mid/high GPU review.
4. Mochi 1 for fallback/research only.
5. HunyuanVideo remains blocked and premium gated.

## Runtime Shape Requirements

- No raw prompt execution: workers must eventually execute approved plan snapshots.
- No public service endpoint for GPU generation proofs.
- No provider secrets or hosted-provider fallback in this open-source lane.
- No public artifacts or signed URLs as source of truth.
- No model auto-download during import or runtime.
- No user media until synthetic proof, private artifact, QA, and beta owner gates pass.
- No Cloud Run/GCP execution unless a later prompt explicitly authorizes it.
- No Docker build or container start in Gate 4.

## Next Allowed Gate

The next safe implementation gate is dependency installation proof only. It may install dependencies in a controlled future prompt if and only if that prompt repeats safety preflight, proves the target environment, and keeps weights, imports, inference, Docker/GCP execution, user media, storage, and beta closed.

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No checksum is computed. No model import is attempted. No inference is run. No generated video is created. No Docker container is built or started. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-5: controlled dependency install proof, no weights/no inference`
