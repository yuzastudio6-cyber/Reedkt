# Qwen2.5-VL 7B Cloud Run GPU Dockerfile Source Spec

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_dockerfile_source_spec_ready_for_private_cache_mount_review`

This packet authors the Qwen2.5-VL Cloud Run GPU Dockerfile source, fail-closed service wrapper, and private model-cache mount expectations without building an image, pushing an image, deploying Cloud Run, uploading model files, importing Qwen, loading Qwen, or running inference.

This packet does not build Docker, push images, create Artifact Registry images, deploy Cloud Run, create a Cloud Run service or job, create buckets, upload model files, mount Cloud Storage, create IAM bindings, create VMs, create reservations, import Qwen on GPU, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-build-image-plan.ts`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `docker/prod/vlm-sglang-runtime/README.md`
- `server/workers/vlm-runtime/requirements.vlm.txt`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Source Files Added

| File | Purpose |
| --- | --- |
| `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile` | Source-only Cloud Run image definition aligned with the existing VLM runtime boundary. |
| `docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt` | Qwen2.5-VL runtime pins matching the prepared Linux L4 wheelhouse and SGLang fallback package. |
| `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile.dockerignore` | Minimal build context allowlist for a future build approval. |
| `docker/prod/qwen2-5-vl-cloud-run-gpu/README.md` | Source-spec scope and fail-closed behavior. |
| `server/workers/qwen2_5_vl_cloud_run_gpu/service.py` | Tiny health/readiness wrapper that does not import or load Qwen and rejects POST execution. |
| `server/workers/qwen2_5_vl_cloud_run_gpu/__init__.py` | Worker package marker. |

## Dockerfile Source Behavior

| Area | Value |
| --- | --- |
| Source file authored | true |
| Docker build run | false |
| Docker push run | false |
| Artifact Registry image created | false |
| Base image | `pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime` |
| CUDA/L4 alignment | yes, inherited from existing VLM lane source pattern |
| Existing VLM lane reused | yes |
| Duplicate runtime stack created | false |
| Model weights in image | false |
| Request-time dependency install | false |
| Model hub download path | disabled |
| Health endpoint loads model | false |
| POST execution accepted | false |

The Dockerfile is a source artifact only. It must not be built until the private model-cache mount, image size, dependency source, cold-start, IAM, and service deploy checks are separately approved.

## Fail-closed Runtime Defaults

| Name | Value |
| --- | --- |
| `HF_HUB_OFFLINE` | `1` |
| `TRANSFORMERS_OFFLINE` | `1` |
| `HF_HUB_DISABLE_TELEMETRY` | `1` |
| `MODEL_DOWNLOADS_ENABLED` | `false` |
| `RAW_VLM_PROMPT_ENABLED` | `false` |
| `PROVIDER_EXECUTION_ENABLED` | `false` |
| `MEDIA_PROCESSING_ENABLED` | `false` |
| `REAL_MEDIA_INPUT_ENABLED` | `false` |
| `ARBITRARY_MEDIA_INPUT_ENABLED` | `false` |
| `PUBLIC_OUTPUT_ENABLED` | `false` |
| `TRACK_A_EXECUTION_ENABLED` | `false` |
| `QWEN_APPROVED_SNAPSHOT_REQUIRED` | `true` |
| `QWEN_QUEUE_LEASE_REQUIRED` | `true` |
| `QWEN_MODEL_IMPORT_ON_STARTUP` | `false` |
| `QWEN_INFERENCE_ENABLED` | `false` |

## Private Model-cache Mount Expectation

| Area | Value |
| --- | --- |
| Mount strategy status | source expectation only |
| Private cache mount path | `/models/qwen2.5-vl-7b-instruct` |
| Expected model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Expected revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Bucket created | false |
| Object uploaded | false |
| Volume mounted | false |
| Public model source allowed | false |
| Request-time model download allowed | false |
| Model copied into image | false |

The private model-cache path remains a mount expectation only. This packet does not create cloud storage, upload weights, create IAM bindings, or configure a Cloud Run volume.

## Service Carry-forward

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

The selected GPU lifecycle still runs only when invoked in a future approved Cloud Run service. With `minInstances=0`, no idle GPU instance is kept alive by this source spec.

## Runtime Gates

- `dockerfileSourceCreated=true`
- `serviceWrapperSourceCreated=true`
- `privateCacheMountSpecCreated=true`
- `dockerBuildRun=false`
- `dockerPushRun=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `artifactRegistryImageCreated=false`
- `gcsBucketCreated=false`
- `gcsObjectUploaded=false`
- `cloudRunVolumeMountCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
- `dependencyInstallRun=false`
- `modelImportRun=false`
- `modelLoadRun=false`
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

## Remaining Blockers Before Build

- Private model-cache bucket/path review is not complete.
- Private model-cache upload/mount IAM is not approved.
- Cloud Storage FUSE model-load compatibility is not proven.
- Offline wheelhouse build-context path is not approved.
- Cloud Run cold-start/import proof is not approved.
- Private invocation IAM binding plan is not approved.
- Queue dispatch contract is not implemented.
- Service deploy is not approved.
- No model inference proof is approved.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_17-CLOUD-RUN-GPU-PRIVATE-CACHE-MOUNT-REVIEW: define private model cache bucket/mount/IAM plan, no upload/no deploy/no inference`
