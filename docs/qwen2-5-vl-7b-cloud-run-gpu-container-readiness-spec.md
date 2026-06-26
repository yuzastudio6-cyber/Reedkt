# Qwen2.5-VL 7B Cloud Run GPU Container Readiness Spec

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_container_readiness_spec_ready_for_no_build_image_plan`

This packet defines the Qwen2.5-VL 7B Cloud Run container and model-cache readiness shape after the read-only Cloud Run L4 quota preflight passed. It keeps the runtime scale-to-zero path and avoids duplicating the existing VLM/SGLang runtime lane.

This packet does not build Docker, push images, deploy Cloud Run, create Artifact Registry artifacts, create VMs, create reservations, install dependencies on a VM, import models on GPU, run inference, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `cloudbuild/vlm-sglang-runtime-phase39c.yaml`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Container Lane Decision

| Area | Decision |
| --- | --- |
| Existing VLM runtime lane | `docker/prod/vlm-sglang-runtime` found |
| Duplicate runtime stack | rejected |
| Immediate container build | false |
| Immediate Cloud Run deploy | false |
| Selected container direction | Qwen-specific Cloud Run service wrapper extending the existing VLM runtime boundary |
| Existing SGLang lane reuse | allowed after review, but current file remains staging/job-oriented |
| New production service code | not added in this packet |
| Model weights in image | rejected for first proof |
| Runtime dependency install at request time | rejected |
| Offline wheelhouse use | required for future image build plan |

The existing VLM/SGLang runtime image is a staging-only job image. It contains runtime dependencies and worker code only, with no model weights, tokenizer payloads, generated fixtures, secrets, credentials, or production service code. Qwen Cloud Run should not copy that path blindly into a production service. The next step is a no-build image plan that decides whether to extend the existing lane or create a narrow Qwen service wrapper.

## Private Model Cache Readiness

| Area | Value |
| --- | --- |
| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Private cache path | `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Total bytes | `16595981281` |
| Private model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Runtime mount created | false |
| Cloud Run model cache strategy approved | false |
| Model hub auto-download | rejected |
| Public model artifact | rejected |

The first Cloud Run proof must not download from Hugging Face at request time. It must use an approved private model-cache strategy. Acceptable future options are:

1. Private image layer with model files only after storage/security review approves image size and artifact lifecycle.
2. Private GCS-backed model artifact mounted or copied during startup only after bucket/IAM/checksum review.
3. Ephemeral Compute Engine fallback if Cloud Run model-cache and cold-start constraints are not acceptable.

## Wheelhouse Readiness

| Area | Value |
| --- | --- |
| Wheelhouse path | `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64` |
| Wheel count | `158` |
| Wheelhouse bytes | `4960843100` |
| Wheelhouse aggregate SHA-256 | `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c` |
| Offline/no-index install required | true |
| Runtime dependency install at request time | rejected |
| Package source build in Cloud Run startup | rejected |

The future image plan should install dependencies during image build from the verified wheelhouse or from a reviewed package source. It must not pip install dependencies at request time.

## Cloud Run Service Carry-forward

| Field | Value |
| --- | --- |
| Service name | `reeditpro-qwen2-5-vl-l4-worker` |
| Region | `us-central1` |
| GPU type | `nvidia-l4` |
| GPU count | `1` |
| CPU | `8` |
| Memory | `32Gi` |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Timeout candidate | `900s` |
| Public unauthenticated access | rejected |
| Backend-only invocation | required |

## Required Runtime Defaults

Future image or service env must preserve these fail-closed defaults:

| Name | Value |
| --- | --- |
| `HF_HUB_OFFLINE` | `1` |
| `TRANSFORMERS_OFFLINE` | `1` |
| `HF_HUB_DISABLE_TELEMETRY` | `1` |
| `MODEL_DOWNLOADS_ENABLED` | `false` |
| `RAW_VLM_PROMPT_ENABLED` | `false` |
| `PROVIDER_EXECUTION_ENABLED` | `false` |
| `MEDIA_PROCESSING_ENABLED` | `false` |
| `PUBLIC_OUTPUT_ENABLED` | `false` |
| `TRACK_A_EXECUTION_ENABLED` | `false` |
| `QWEN_APPROVED_SNAPSHOT_REQUIRED` | `true` |
| `QWEN_QUEUE_LEASE_REQUIRED` | `true` |

No API keys, service-role keys, database URLs, provider credentials, model tokens, signed URL tokens, or raw secrets may be placed in environment variables.

## Container Readiness Checks Required Before Build

- Decide vLLM versus SGLang for Qwen Cloud Run service.
- Confirm whether existing `docker/prod/vlm-sglang-runtime` is extended or a Qwen-specific wrapper is created.
- Define private model-cache source of truth.
- Define offline wheelhouse copy/install path.
- Define startup health endpoint without importing the full model unless proof prompt allows it.
- Define model import proof command separately from service deploy.
- Define timeout and startup probe values.
- Define private invocation/IAM service account.
- Define log fields that do not expose prompts, media URLs, secrets, or model paths.
- Define queue lease/idempotency contract.

## Runtime Gates

- `containerReadinessSpecCreated=true`
- `dockerBuildRun=false`
- `dockerPushRun=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `artifactRegistryImageCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
- `dependencyInstallRun=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `apiServerStarted=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_15-CLOUD-RUN-GPU-NO-BUILD-IMAGE-PLAN: define Qwen Cloud Run image build plan and private model-cache strategy, no build/no deploy/no inference`
