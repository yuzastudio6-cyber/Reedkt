# Qwen2.5-VL 7B Cloud Run GPU Fail-closed Deploy Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_fail_closed_service_deployed_no_model_import_no_inference`

This packet records the bounded Cloud Run service deployment for the fail-closed Qwen2.5-VL 7B GPU worker. The service is deployed with the private model-cache mount, authenticated/internal ingress, `minInstances=0`, and all model/inference/provider/media/output gates disabled.

This packet does not import Qwen, load Qwen, run inference, send a runtime request, call providers, dispatch workers, touch Supabase, execute SQL, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md`
- `docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Deploy Command Summary

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Revision | `reeditpro-qwen2-5-vl-l4-worker-00001-t88` |
| Operation ID | `ab759df5-4fe9-4a33-bbe7-e0c0963b8bbe` |
| Image digest | `sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| GPU | `1` x `nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Timeout | `900s` |
| Deploy health check | disabled |
| Public unauthenticated access | disabled |
| Ingress | `internal-and-cloud-load-balancing` |
| CPU throttling | disabled |
| GPU zonal redundancy | disabled for first cost-focused proof |
| Service URL | present but redacted in repo evidence |

## Revision Readiness

| Area | Value |
| --- | --- |
| Service ready | true |
| Latest ready revision | `reeditpro-qwen2-5-vl-l4-worker-00001-t88` |
| Revision ready | true |
| Revision deploy duration | `7m13.87s` |
| Container image import | completed |
| Container image import duration | `7m11.18s` |
| Imported container provisioning | completed in `1.84s` |
| Traffic | `100%` to latest revision |

## Private Model-cache Mount

| Area | Value |
| --- | --- |
| Volume name | `qwen-model-cache` |
| Driver | `gcsfuse.run.googleapis.com` |
| Bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Read-only | true |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Mount options | `only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs` |
| Runtime data-plane read proof | still required |
| Model import through mount | not attempted |

## Auth And Exposure

| Area | Value |
| --- | --- |
| IAM policy bindings | none |
| `allUsers` invoker binding | false |
| `allAuthenticatedUsers` invoker binding | false |
| Public unauthenticated access | false |
| Ingress allows all public traffic | false |
| Default service URL exists | true |
| Default service URL used by this prompt | false |
| Runtime request sent by this prompt | false |

The service has a Cloud Run URL as a platform routing artifact, but unauthenticated invocation is disabled and ingress is restricted to internal and Cloud Load Balancing sources.

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
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct`
- `QWEN_MODEL_REVISION=cc594898137f460bfe9f0759e9844b3ce807cfb5`
- `QWEN_MODEL_AGGREGATE_SHA256=46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`

## Runtime Gates

- `cloudRunDeployCommandExecuted=true`
- `cloudRunServiceCreated=true`
- `cloudRunRevisionReady=true`
- `cloudRunVolumeMountCreated=true`
- `artifactRegistryImageCreated=true`
- `minInstancesZero=true`
- `maxInstancesOne=true`
- `publicUnauthenticatedAccessAllowed=false`
- `ingressAllAllowed=false`
- `deployHealthCheckDisabled=true`
- `runtimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `apiServerInvoked=false`
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

## Remaining Blockers

- No runtime request has been sent to the service.
- No private mount read proof has run inside Cloud Run.
- No aggregate checksum verification has run from the mounted path.
- No model import/load proof has run.
- No inference proof is approved.
- No worker queue dispatch, approved snapshot execution, QA row, or credit gate has been used.
- No beta or production readiness is claimed.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_25-CLOUD-RUN-GPU-PRIVATE-MOUNT-READ-PROOF: verify fail-closed Cloud Run service mount/readiness, no model import/no inference`
