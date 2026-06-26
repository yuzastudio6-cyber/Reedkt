# QWEN2_5_VL_STACK_TOOL_15-CLOUD-RUN-GPU-NO-BUILD-IMAGE-PLAN: define Qwen Cloud Run image build plan and private model-cache strategy, no build/no deploy/no inference

## Goal

Define the Qwen Cloud Run image build plan and private model-cache strategy without running Docker, building an image, pushing to Artifact Registry, deploying Cloud Run, importing the model, or running inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`

## Required Output

- Image build strategy decision.
- Private model-cache strategy decision.
- Dockerfile path decision.
- Artifact Registry path decision.
- Offline wheelhouse install plan.
- Startup/import proof separation.
- No-build/no-deploy diagnostics.

## Forbidden Work

- Do not build Docker.
- Do not push Docker images.
- Do not create Artifact Registry images.
- Do not deploy Cloud Run.
- Do not create a VM.
- Do not create a reservation.
- Do not install dependencies on a VM.
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
