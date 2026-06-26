# QWEN2_5_VL_STACK_TOOL_19-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-EXECUTE: upload private model cache to approved private bucket and verify checksum, no deploy/no inference

## Goal

Upload the verified private Qwen2.5-VL model cache to the approved private bucket and prefix, then verify remote file count, total bytes, and checksum. Do not deploy Cloud Run and do not run inference.

## Required Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- local private model cache outside the git worktree

## Required Safety Preflight

- Confirm active project is `reeditpro`.
- Confirm selected bucket exists in `US-CENTRAL1`.
- Confirm selected prefix is empty or contains only the same revision manifest.
- Confirm local cache path is outside the git worktree.
- Confirm local file count is `16`.
- Confirm total bytes are `16595981281`.
- Confirm aggregate SHA-256 is `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`.

## Forbidden Work

- Do not deploy Cloud Run.
- Do not create or update a Cloud Run service.
- Do not create Cloud Run volume mounts.
- Do not build Docker.
- Do not push Docker images.
- Do not create Artifact Registry images.
- Do not create service-account keys.
- Do not create signed URLs or public artifacts.
- Do not import Qwen on GPU.
- Do not run inference.
- Do not start an API server.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `generated_local_fixture_passed`.
