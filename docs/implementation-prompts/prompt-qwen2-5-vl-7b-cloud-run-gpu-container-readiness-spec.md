# QWEN2_5_VL_STACK_TOOL_14-CLOUD-RUN-GPU-CONTAINER-READINESS-SPEC: define Qwen Cloud Run container and model-cache readiness, no build/no deploy/no inference

## Goal

Define the Qwen Cloud Run container and model-cache readiness spec after read-only quota preflight passed. This prompt must not build Docker, push images, deploy Cloud Run, run inference, or mutate GCP.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`

## Required Spec Content

- Decide whether to reuse/extend `docker/prod/vlm-sglang-runtime` or create a Qwen-specific runtime lane.
- Define model-cache strategy for Cloud Run without public artifacts.
- Define image contents and explicitly exclude model weights unless a future storage review approves baking them.
- Define startup probe, health endpoint, timeout, and idle behavior.
- Preserve min instances `0`, max instances `1`, concurrency `1`, and no public unauthenticated access.
- Keep all runtime execution gates false.

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
