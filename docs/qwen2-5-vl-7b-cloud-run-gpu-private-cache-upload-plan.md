# Qwen2.5-VL 7B Cloud Run GPU Private Cache Upload Plan

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_plan_ready_for_upload_execute_no_deploy`

This packet defines the future private model-cache upload and checksum verification plan for Qwen2.5-VL 7B without uploading model files, creating buckets, creating IAM bindings, deploying Cloud Run, building Docker, importing Qwen, loading Qwen, or running inference.

This packet does not create Cloud Storage, upload model weights, create Cloud Run volumes, create IAM bindings, create service-account keys, build Docker, push Docker, create Artifact Registry images, deploy Cloud Run, create a Cloud Run service or job, create VMs, create reservations, import Qwen on GPU, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

Do not deploy Cloud Run.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts`
- `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md`

## Read-only GCP Inventory

Read-only bucket inventory found an existing private staging bucket in the target region:

| Area | Value |
| --- | --- |
| Project inspected | `reeditpro` |
| Existing target bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Bucket location | `US-CENTRAL1` |
| Dedicated new bucket needed for first proof | false |
| Bucket created now | false |
| Bucket mutation run now | false |

The earlier standalone bucket candidate remains unnecessary for the first proof because the repo already uses the staging generated-assets bucket for private model-weight prefixes. Reusing the existing bucket avoids duplicate storage infrastructure and keeps the future path closer to existing worker conventions.

Read-only service-account inventory found an existing GPU worker identity:

| Area | Value |
| --- | --- |
| Candidate runtime identity | `reeditpro-stg-gpu-worker-sa` |
| Display label | `ReeditPro production GPU AI worker` |
| Service-account key file created | false |
| IAM binding created now | false |

## Selected Upload Target

| Area | Value |
| --- | --- |
| Upload target status | future execution only |
| Selected bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Selected object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |
| Container mount path | `/models/qwen2.5-vl-7b-instruct` |
| Cloud Run volume name | `qwen-model-cache` |
| Public model source allowed | false |
| Signed URL source allowed | false |
| Request-time model download allowed | false |
| Model baked into image | false |
| Object uploaded now | false |
| Cloud Run mount created now | false |

## Upload Manifest

| Area | Value |
| --- | --- |
| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Local private cache path | `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| File count | `16` |
| Weight shard count | `5` |
| Total bytes | `16595981281` |
| Checksum algorithm | `sha256` |
| Aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Upload manifest created now | plan only |
| Object upload run now | false |

The future upload step must verify the local manifest before upload, upload only these 16 files under the selected prefix, then re-list and checksum the cloud objects before any Cloud Run mount or model import proof.

## Future Upload Command Plan

The future upload step should use an explicit dry preflight before any mutation:

1. Confirm active project is `reeditpro`.
2. Confirm selected bucket exists in `US-CENTRAL1`.
3. Confirm selected prefix is empty or contains only the same revision manifest.
4. Confirm the local cache is outside the git worktree.
5. Confirm local file count, total bytes, and aggregate SHA-256 match this plan.
6. Upload to the selected private bucket and prefix only after the preflight passes.
7. Recompute or verify remote checksums.
8. Write a result report without printing credential material.

The future upload command must use bucket and prefix variables rather than hard-coded public URLs. It must not create signed URLs, public ACLs, service-account keys, broad storage admin roles, or request-time model downloads.

## Future IAM And Mount Follow-up

| Area | Decision |
| --- | --- |
| Runtime identity | existing GPU worker service identity candidate |
| Required access | read-only object access for selected prefix |
| Broad bucket admin | rejected |
| Public principal | rejected |
| Service-account key file | rejected |
| Cloud Run mount | future deploy/spec only |
| Cloud Run deploy | not approved |
| Model import proof | not approved |
| Model inference proof | not approved |

## Runtime Gates

- `privateCacheUploadPlanCreated=true`
- `bucketCreated=false`
- `gcsObjectUploaded=false`
- `remoteChecksumVerified=false`
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

- Upload execution approval is not complete.
- Prefix emptiness or same-revision safety has not been checked.
- Remote checksum verification has not run.
- Prefix-scoped read-only IAM is not approved.
- Cloud Run volume mount command/spec is not approved.
- Docker image build is not approved.
- Cloud Run deploy is not approved.
- Model import proof is not approved.
- Model inference proof is not approved.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_19-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-EXECUTE: upload private model cache to approved private bucket and verify checksum, no deploy/no inference`
