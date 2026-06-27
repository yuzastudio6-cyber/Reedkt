# Qwen2.5-VL 7B Approved-fixture Inference Service Deploy Result

Decision: `qwen2_5_vl_approved_fixture_inference_service_deployed_no_fixture_inference_yet`.

Mode: `qwen2_5_vl_approved_fixture_inference_service_deploy_result`.

This packet records the controlled deployment of the gated Qwen2.5-VL approved-fixture inference service source and the matching CPU-only private caller image. It built and pushed the GPU service image, deployed the Cloud Run GPU service revision, built and pushed the CPU caller image, and updated the Cloud Run Job definition. It did not execute the CPU caller job, fetch an identity token, invoke Cloud Run, import Qwen, load vLLM, run inference, call providers, dispatch workers, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-approved-fixture-inference-service-source.md`
- `docs/qwen2-5-vl-7b-approved-fixture-inference-smoke-plan.md`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile`
- `cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.yaml`

## GPU Service Build

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Repository | `reeditpro-staging-workers` |
| Image package | `qwen2-5-vl-7b-cloud-run-gpu` |
| Image tag | `approved-fixture-service-source-d40a0a5d-20260627t171657z` |
| Build ID | `0d9e476b-933d-4bf4-9575-b04fb9919444` |
| Build status | `SUCCESS` |
| Source context | `qwen_gpu_service_source_only_context` |
| Source file count | `7` |
| Source size before compression | `25.0 KiB` |
| Uploaded archive size | `7.7 KiB` |
| Image digest | `sha256:92e78bb19e86553ed321e02ef4a40a3e14b46f805b2f1f44c06401eeb130f61c` |
| Model weights included | false |
| Generated media included | false |
| Secrets included | false |

## GPU Service Deploy

| Area | Value |
| --- | --- |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Latest ready revision | `reeditpro-qwen2-5-vl-l4-worker-00005-bw9` |
| Ready | true |
| Traffic | `100%` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| GPU | `1` x `nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
| Concurrency | `1` |
| Timeout | `900s` |
| Min instances | `0` |
| Template max instances | `1` |
| Ingress | `internal-and-cloud-load-balancing` |
| Public unauthenticated access | false |
| Deploy health check | disabled |
| CPU throttling | disabled |
| CPU boost | enabled |
| GPU zonal redundancy | disabled |
| Service URL | present but redacted from repo evidence |

The Cloud Run platform still creates service routing metadata, but unauthenticated access is disabled and ingress is restricted. No service URL value is committed in this evidence.

## Private Model-cache Mount

| Area | Value |
| --- | --- |
| Volume name | `qwen-model-cache` |
| Driver | `gcsfuse.run.googleapis.com` |
| Bucket | `reeditpro-staging-reeditpro-model-cache` |
| Read-only | true |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Mount options | `only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |

## CPU Caller Build And Job Update

| Area | Value |
| --- | --- |
| Repository | `reeditpro-workers` |
| Image package | `qwen2-5-vl-private-invoke-cpu-caller` |
| Image tag | `approved-fixture-service-source-d40a0a5d-20260627t1739z` |
| Build ID | `22155166-7b2a-4f15-9ce0-ce320f787299` |
| Build status | `SUCCESS` |
| Source context | `temporary_caller_only_context` |
| Source file count | `5` |
| Source size before compression | `15.1 KiB` |
| Uploaded archive size | `5.0 KiB` |
| Image digest | `sha256:14d9aca4fddc04b6a63f2135287792d71e320007214cc496e2f885bacb7465ee` |
| Job name | `reeditpro-qwen2-5-vl-private-caller` |
| Job ready | true |
| Service account | `qwen-private-caller-sa@reeditpro.iam.gserviceaccount.com` |
| CPU | `1` |
| Memory | `512Mi` |
| Tasks | `1` |
| Max retries | `0` |
| Timeout | `60s` |
| Direct VPC subnet | `qwen-private-caller-us-central1` |
| VPC egress | `all-traffic` |
| Job executed by this packet | false |

The CPU caller build context contained only the caller Dockerfile and caller source files. It did not include model weights, generated media, environment files, secrets, local caches, or broad repository artifacts.

## Fail-closed Environment Verified

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `HF_HUB_DISABLE_TELEMETRY=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `REAL_MEDIA_INPUT_ENABLED=false`
- `ARBITRARY_MEDIA_INPUT_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`
- `QWEN_APPROVED_SNAPSHOT_REQUIRED=true`
- `QWEN_QUEUE_LEASE_REQUIRED=true`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`

The source can support a later approved fixture inference smoke, but the persistent service and job defaults remain fail-closed after deployment.

## Runtime Gates

- `deployResultRecorded=true`
- `gcpBuildMutationOccurred=true`
- `gcpCloudRunServiceDeployMutationOccurred=true`
- `gcpCloudRunJobDeployMutationOccurred=true`
- `gpuServiceImageBuilt=true`
- `gpuServiceImagePushed=true`
- `gpuServiceDeployed=true`
- `gpuServiceReady=true`
- `gpuServiceRevisionReady=true`
- `gpuServiceTrafficUpdated=true`
- `gpuServiceInternalIngressOnly=true`
- `gpuServicePublicUnauthenticatedAccessAllowed=false`
- `gpuServiceMinInstancesZero=true`
- `gpuServiceTemplateMaxInstancesOne=true`
- `gpuServiceModelCacheMountedReadOnly=true`
- `cpuCallerImageBuilt=true`
- `cpuCallerImagePushed=true`
- `cpuCallerJobUpdated=true`
- `cpuCallerJobReady=true`
- `cpuCallerJobExecuted=false`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `fixtureInferenceSmokeExecuted=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `renderExportRun=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blockers

- One controlled private approved-fixture inference smoke has not yet been executed.
- The next smoke must enable fixture inference only for the bounded request and must still produce sanitized metadata-only output.
- No generated asset, public artifact, signed URL, beta readiness, production readiness, or final render/export readiness may be claimed from this deploy.
- The fixture smoke result still needs review before any broader runtime unlock.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58B-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke against gated service, no generated assets/no beta`
