# QWEN2_5_VL_STACK_TOOL_12-CLOUD-RUN-GPU-NO-DEPLOY-SERVICE-SPEC: author Qwen scale-to-zero Cloud Run service spec, no deploy/no inference

## Goal

Author a no-deploy Cloud Run service spec for Qwen2.5-VL 7B that preserves scale-to-zero cost behavior. This prompt must not deploy Cloud Run, build or push Docker images, create Artifact Registry artifacts, run inference, call providers, dispatch workers, or mutate cloud resources.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts`
- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`

## Required Spec Content

- service name `reeditpro-qwen2-5-vl-l4-worker`;
- region `us-central1`;
- GPU type `nvidia-l4`;
- GPU count `1`;
- min instances `0`;
- max instances `1`;
- concurrency `1`;
- CPU/memory candidate `8 CPU / 32 GiB`;
- proof floor `4 CPU / 16 GiB`;
- no public unauthenticated access;
- backend-only invocation;
- private model cache strategy;
- startup probe and timeout plan;
- queue lease/idempotency requirement;
- approved snapshot and credit gate requirement;
- fallback to ephemeral Compute Engine L4 worker;
- all runtime execution gates false.

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
