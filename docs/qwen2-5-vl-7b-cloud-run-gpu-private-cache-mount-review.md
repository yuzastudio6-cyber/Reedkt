# Qwen2.5-VL 7B Cloud Run GPU Private Cache Mount Review

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_review_ready_for_private_cache_upload_plan`

This packet defines the future private model-cache bucket, object-prefix, read-only Cloud Run mount, runtime identity, checksum, and startup-copy expectations for Qwen2.5-VL 7B without creating buckets, uploading objects, creating IAM bindings, deploying Cloud Run, building Docker, importing Qwen, loading Qwen, or running inference.

This packet does not create Cloud Storage, upload model weights, create Cloud Run volumes, create IAM bindings, create service-account keys, build Docker, push Docker, create Artifact Registry images, deploy Cloud Run, create a Cloud Run service or job, create VMs, create reservations, import Qwen on GPU, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-dockerfile-source-spec.ts`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Selected Private Cache Strategy

| Area | Decision |
| --- | --- |
| Cache strategy | private Cloud Storage model-cache path |
| Bucket candidate | `reeditpro-qwen2-5-vl-model-cache-us-central1` |
| Object prefix candidate | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Container mount path | `/models/qwen2.5-vl-7b-instruct` |
| Cloud Run volume name | `qwen-model-cache` |
| Mount mode | read-only |
| Public model source allowed | false |
| Request-time model download allowed | false |
| Model baked into image | false |
| Signed URL source allowed | false |
| Cloud Storage object uploaded now | false |
| Cloud Run mount created now | false |

The future upload plan must preserve the private cache aggregate SHA-256 `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` and the model revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`.

## Runtime Identity And IAM Plan

| Area | Decision |
| --- | --- |
| Runtime identity | Cloud Run service identity, no key file |
| Candidate identity label | `qwen-cloud-run-worker-runtime` |
| Required bucket role | object read only |
| Scope | selected object prefix only |
| Service-account key file allowed | false |
| Public principal allowed | false |
| Broad storage admin allowed | false |
| IAM binding created now | false |
| Secret Manager read required | false |

The future IAM step must use service identity bindings only. It must not commit key files, print tokens, create public principals, or grant broad storage/admin permissions.

## Cloud Run Mount Expectations

| Area | Value |
| --- | --- |
| Service name | `reeditpro-qwen2-5-vl-l4-worker` |
| Region | `us-central1` |
| GPU type | `nvidia-l4` |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Container env mount path | `QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct` |
| Health endpoint loads model | false |
| Model import on startup | false |
| Inference enabled | false |
| Backend-only invocation | required |

The mount must be created only in a future approved deploy/spec step. This review does not create or update a Cloud Run service.

## Startup Copy And Checksum Plan

| Area | Decision |
| --- | --- |
| Direct FUSE read | candidate for metadata/import proof only |
| Copy from mount to local ephemeral path | candidate if loader compatibility requires it |
| Local ephemeral candidate | `/tmp/reeditpro-qwen2-5-vl/model-cache` |
| Checksum before import | required |
| Model import before checksum | forbidden |
| Inference before approved snapshot and queue lease | forbidden |
| Startup health loads full model | false |
| Request-time download fallback | forbidden |

The next implementation must decide whether Cloud Storage FUSE is sufficient for Qwen local-file loading or whether startup should copy the private cache into local ephemeral storage before a future import proof.

## Runtime Gates

- `privateCacheMountReviewCreated=true`
- `bucketCreated=false`
- `gcsObjectUploaded=false`
- `iamBindingCreated=false`
- `serviceAccountKeyCreated=false`
- `cloudRunVolumeMountCreated=false`
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

## Remaining Blockers Before Upload Or Deploy

- Bucket existence and naming approval are not complete.
- Upload manifest and checksum verification procedure are not complete.
- Prefix-scoped read-only IAM is not approved.
- Cloud Run volume mount command/spec is not approved.
- Cloud Storage FUSE cold-start behavior is not proven.
- Startup local-copy behavior is not decided.
- Docker image build is not approved.
- Cloud Run deploy is not approved.
- Model import proof is not approved.
- Model inference proof is not approved.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_18-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-PLAN: plan private model cache upload and checksum verification, no upload/no deploy/no inference`
