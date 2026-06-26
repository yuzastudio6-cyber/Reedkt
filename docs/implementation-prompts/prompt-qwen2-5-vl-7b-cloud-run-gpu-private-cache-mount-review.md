# QWEN2_5_VL_STACK_TOOL_17-CLOUD-RUN-GPU-PRIVATE-CACHE-MOUNT-REVIEW: define private model cache bucket/mount/IAM plan, no upload/no deploy/no inference

## Goal

Define the private model-cache bucket, mount, IAM, checksum, and startup-readiness plan for Qwen2.5-VL Cloud Run GPU without uploading model files, creating buckets, creating IAM bindings, deploying Cloud Run, building Docker, or running inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-dockerfile-source-spec.ts`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`

## Required Output

- Private model-cache bucket/path plan.
- Cloud Run read-only mount plan.
- Service-account IAM plan.
- Checksum verification plan.
- Cold-start and local-copy decision.
- No-upload/no-deploy diagnostics.

## Forbidden Work

- Do not build Docker.
- Do not push Docker images.
- Do not create Artifact Registry images.
- Do not deploy Cloud Run.
- Do not upload model files.
- Do not create GCS buckets or objects.
- Do not create IAM bindings.
- Do not create a VM or reservation.
- Do not import Qwen on GPU.
- Do not run inference.
- Do not start an API server.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not create signed URLs or public artifacts.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `generated_local_fixture_passed`.
