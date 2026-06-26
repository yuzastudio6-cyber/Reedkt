# QWEN2_5_VL_STACK_TOOL_11-CLOUD-RUN-GPU-SCALE-TO-ZERO-REVIEW: evaluate Qwen Cloud Run GPU scale-to-zero fit, no deploy/no inference

## Goal

Evaluate whether Qwen2.5-VL 7B should use Cloud Run GPU as the preferred on-demand runtime so the GPU runs only while work exists and can scale to zero when idle.

This prompt must remain review/spec only. It must not deploy Cloud Run, build/push images, run Docker, create Artifact Registry artifacts, call providers, dispatch workers, run inference, or create generated media.

## Required Inputs

- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`
- `docs/qwen2-5-vl-7b-stack-tool-integration.md`
- `model-routing-policy.md`
- `pricing-and-credits.md`

## Review Requirements

- Confirm Cloud Run GPU supports the needed NVIDIA L4 path in an acceptable region.
- Confirm scale-to-zero and min instances `0` can satisfy the cost requirement.
- Confirm container image size, model cache strategy, and startup latency are acceptable.
- Confirm request timeout, memory, concurrency, and private networking fit Qwen2.5-VL 7B.
- Confirm the runtime can stay backend-only and authenticated.
- Confirm no public endpoint, public artifact, signed URL, or raw chat worker payload is introduced.
- Confirm fallback to ephemeral Compute Engine L4 worker remains available.

## Forbidden Work

- Do not deploy Cloud Run.
- Do not build or push Docker images.
- Do not create Artifact Registry images.
- Do not create a VM.
- Do not create a reservation.
- Do not run inference.
- Do not import Qwen on a GPU runtime.
- Do not start an API server.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not create signed URLs or public artifacts.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `generated_local_fixture_passed`.

## Expected Output

- Cloud Run GPU fit decision.
- Region/quota review plan.
- Container/model-cache readiness checklist.
- Scale-to-zero and idle-cost evidence checklist.
- Ephemeral Compute Engine fallback decision.
- Next prompt for either Cloud Run no-deploy service spec or GCE ephemeral worker spec.
