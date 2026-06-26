# QWEN2_5_VL_STACK_TOOL_13-CLOUD-RUN-GPU-QUOTA-PREFLIGHT: verify Qwen Cloud Run L4 quota and deploy prerequisites, no deploy/no inference

## Goal

Verify Qwen Cloud Run L4 quota and deploy prerequisites for the no-deploy service spec. This prompt must remain read-only: no Cloud Run deploy, no Docker build, no image push, no runtime start, no model import, and no inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`

## Allowed Read-only Checks

- Cloud Run API enabled.
- Artifact Registry API enabled.
- Cloud Run GPU quota visibility.
- Existing service name collision check.
- Existing Artifact Registry repo check.
- IAM/service account read-only check.
- No active reservation/VM check.
- `gcloud run deploy --help` flag check.

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
