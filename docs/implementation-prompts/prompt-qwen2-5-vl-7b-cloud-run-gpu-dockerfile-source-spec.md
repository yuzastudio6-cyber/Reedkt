# QWEN2_5_VL_STACK_TOOL_16-CLOUD-RUN-GPU-DOCKERFILE-SOURCE-SPEC: author Qwen Cloud Run Dockerfile source and private cache mount spec, no build/no deploy/no inference

## Goal

Author Qwen Cloud Run Dockerfile source and private cache mount spec files without building Docker, pushing images, deploying Cloud Run, uploading model files, importing Qwen, or running inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-build-image-plan.ts`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`

## Required Output

- Qwen Cloud Run Dockerfile source path or explicit no-source blocker.
- Private cache mount/service spec text.
- No-build diagnostics.
- All runtime gates false.

## Forbidden Work

- Do not build Docker.
- Do not push Docker images.
- Do not create Artifact Registry images.
- Do not deploy Cloud Run.
- Do not upload model files.
- Do not create GCS buckets or objects.
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
