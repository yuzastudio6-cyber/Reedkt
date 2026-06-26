# Qwen2.5-VL 7B Cloud Run GPU No-build Image Plan

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_no_build_image_plan_ready_for_dockerfile_source_spec`

This packet defines the Qwen2.5-VL 7B Cloud Run image build plan and private model-cache strategy without building an image, pushing an image, deploying Cloud Run, importing the model, or running inference.

This packet does not build Docker, push images, create Artifact Registry images, deploy Cloud Run, create a Cloud Run service or job, create VMs, create reservations, install dependencies on a VM, import Qwen on GPU, run inference, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `docker/prod/vlm-sglang-runtime/requirements.sglang.txt`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Official Cloud Run Planning Inputs

- Cloud Run GPU documentation says L4 GPU services require at least 4 CPU and 16 GiB memory.
- Cloud Run pricing and lifecycle docs support scale-to-zero when min instances are `0`.
- Cloud Run supports Cloud Storage volume mounts through Cloud Storage FUSE, but the mount has memory and filesystem limitations that must be reviewed before model loading.
- Cloud Run deployment documentation warns about large image layers in some deployment paths; the first proof must avoid baking the 16.6 GB model into an image until image size, pull latency, artifact lifecycle, and security are approved.

References:

- `https://docs.cloud.google.com/run/docs/configuring/services/gpu`
- `https://docs.cloud.google.com/run/docs/deploying`
- `https://docs.cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts`
- `https://cloud.google.com/run/pricing`

## Image Build Strategy Decision

| Area | Decision |
| --- | --- |
| Image build status | no-build plan only |
| Dockerfile source created now | false |
| Docker build run | false |
| Image push run | false |
| Artifact Registry image created | false |
| Runtime base | CUDA/PyTorch runtime aligned with existing VLM/SGLang lane |
| Existing VLM lane | reuse boundary from `docker/prod/vlm-sglang-runtime` |
| Duplicate runtime stack | rejected |
| Qwen service wrapper | planned as narrow wrapper around existing VLM boundary |
| Model weights in first proof image | rejected |
| Runtime dependency install at request time | rejected |
| Package source build during startup | rejected |
| Dependency install timing | image build time only, from reviewed wheelhouse or reviewed package source |
| First image plan output | Dockerfile source spec, not image build |

The first proof image should contain runtime dependencies and Qwen service wrapper code only. It must not contain model weights, tokenizer payloads, generated fixtures, secrets, credentials, service-role keys, provider keys, public artifacts, or user media.

## Private Model-cache Strategy Decision

| Option | Decision | Reason |
| --- | --- | --- |
| Bake 16.6 GB model into first proof image | rejected | Too much image/cold-start/artifact lifecycle risk for first proof. |
| Download model from Hugging Face at request time | rejected | Violates private cache and no-request-time install/download policy. |
| Public URL model source | rejected | Model source must remain private and checksum-controlled. |
| Private GCS read-only model cache mount | selected for next review | Best aligns with Cloud Run private model source and avoids baking weights into image. |
| Copy from private GCS mount to local ephemeral path at startup | candidate | May improve model loader compatibility if Cloud Storage FUSE is too slow or not POSIX-enough. |
| Ephemeral Compute Engine L4 VM | fallback | Use if Cloud Run model-cache startup/cold-start constraints are not acceptable. |

The next Dockerfile/source spec must assume a private GCS-backed model cache path such as `QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct`, but it must not create buckets, upload files, mount volumes, or create service bindings in this packet.

## Private Cache Evidence

| Area | Value |
| --- | --- |
| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Local private cache path | `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Total bytes | `16595981281` |
| Private model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Cloud Run private cache created | false |
| Cloud Run volume mount created | false |
| GCS object uploaded | false |
| Model hub auto-download | rejected |

## Wheelhouse Evidence

| Area | Value |
| --- | --- |
| Wheelhouse path | `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64` |
| Wheel count | `158` |
| Wheelhouse bytes | `4960843100` |
| Wheelhouse aggregate SHA-256 | `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c` |
| Offline/no-index install required | true |
| Runtime dependency install at request time | rejected |
| Package source build in Cloud Run startup | rejected |

## Proposed Future Image Contents

The future Dockerfile source spec should include:

- CUDA/PyTorch runtime base compatible with L4;
- Python 3.12 or an explicitly reviewed Python runtime alignment;
- Qwen runtime dependencies installed at image build time from the verified wheelhouse or reviewed package source;
- Qwen service wrapper code only;
- startup health endpoint that does not load the full model;
- separate no-inference model import proof command;
- fail-closed environment defaults;
- no model weights;
- no secrets;
- no service-account key files;
- no generated media;
- no public output paths;
- no provider transport code.

## Required Runtime Defaults

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

## Blockers Before Build

- No Qwen Cloud Run Dockerfile source spec exists.
- No private GCS model-cache bucket/path plan exists.
- No model cache upload/mount permission plan exists.
- No Cloud Storage FUSE model-load compatibility proof exists.
- No cold-start/import proof exists.
- No private invocation IAM binding plan exists.
- No queue dispatch implementation exists.
- No service deploy approval exists.
- No model inference proof approval exists.

## Runtime Gates

- `imageBuildPlanCreated=true`
- `dockerfileSourceCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_16-CLOUD-RUN-GPU-DOCKERFILE-SOURCE-SPEC: author Qwen Cloud Run Dockerfile source and private cache mount spec, no build/no deploy/no inference`
