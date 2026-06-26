# QWEN2_5_VL_STACK_TOOL_18-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-PLAN: plan private model cache upload and checksum verification, no upload/no deploy/no inference

## Goal

Plan the private model-cache upload and checksum verification path for Qwen2.5-VL Cloud Run GPU without uploading model files, creating buckets, creating IAM bindings, deploying Cloud Run, building Docker, or running inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`

## Required Output

- Private cache upload manifest plan.
- Upload command plan, not execution.
- Checksum verification plan.
- Bucket and prefix safety checks.
- No-upload/no-deploy diagnostics.

## Forbidden Work

- Do not upload model files.
- Do not create GCS buckets or objects.
- Do not create IAM bindings.
- Do not build Docker.
- Do not push Docker images.
- Do not deploy Cloud Run.
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
