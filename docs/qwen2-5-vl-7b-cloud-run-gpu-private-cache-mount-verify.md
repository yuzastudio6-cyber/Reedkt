# Qwen2.5-VL 7B Cloud Run GPU Private Cache Mount Verify

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_verified_for_no_deploy_mount_spec`

This packet records the completed private Cloud Storage model-cache inventory and the prefix-scoped read IAM evidence needed before a future Cloud Run GPU mount spec for `Qwen/Qwen2.5-VL-7B-Instruct` revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`.

This packet does not deploy Cloud Run, create a Cloud Run service, create a Cloud Run job, create or update a Cloud Run volume mount, build Docker, push Docker, create Artifact Registry images, create VMs, create reservations, import Qwen on GPU, load model weights into a runtime, run inference, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No GPU instance or Cloud Run GPU service is running from this packet.

## Source Inputs

- `docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md`
- `src/backend/mock/mock-qwen2-5-vl-storage-transfer-url-list-result.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/README.md`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Verified Private Cache

Approved prefix:

```text
gs://reeditpro-staging-reeditpro-generated-assets/model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/
```

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Bucket | `reeditpro-staging-reeditpro-generated-assets` |
| Bucket location | `US-CENTRAL1` |
| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Final prefix object count | `16` |
| Final prefix total bytes | `16595981281` |
| Final prefix total GiB | `15.46GiB` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Cloud aggregate SHA-256 recomputed now | false |
| Current-user object metadata read | true |
| `config.json` generation | `1782514722459524` |
| `config.json` size | `1374` |

The completed object inventory proves the private model cache is present at the approved prefix and matches the expected object count and byte total from the controlled manifest. This packet does not prove Cloud Storage FUSE mount compatibility, startup local-copy behavior, model import, CUDA visibility, or inference behavior.

## Runtime Identity And IAM Evidence

| Area | Result |
| --- | --- |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| IAM role | `roles/storage.objectViewer` |
| IAM condition title | `qwen25vl_model_read` |
| IAM condition scope | selected Qwen2.5-VL private model prefix only |
| Service-account key file created | false |
| Public principal granted | false |
| Broad storage admin granted | false |
| Secret Manager read performed | false |
| TokenCreator granted for probe | false |

Prefix-scoped read-only IAM binding present:

```text
resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/")
```

The binding follows the existing bucket convention used for other ReeditPro private model-cache prefixes.

## Read-Path Probe Results

| Probe | Result |
| --- | --- |
| Object metadata read as active operator | passed |
| Final prefix inventory as active operator | passed |
| Cloud Run services checked in `us-central1` | passed |
| Qwen Cloud Run service found | false |
| Impersonated object read as runtime identity | not run to data plane |
| Impersonation blocker | active operator lacks `iam.serviceAccounts.getAccessToken` on runtime identity |
| TokenCreator added to complete impersonation probe | false |
| Policy Troubleshooter membership matched | true |
| Policy Troubleshooter role permission included | true |
| Policy Troubleshooter condition granted | false in tool context |

The impersonation probe stopped before data-plane storage access because the active operator cannot mint access tokens for the runtime service account. No TokenCreator permission was added. The Policy Troubleshooter output confirmed membership and role permission inclusion for the `qwen25vl_model_read` binding, but the condition evaluated as not granted in that tool context. The next no-deploy mount spec must preserve the prefix-scoped binding and include a deploy-time or runtime-side read proof rather than broadening IAM.

## Cloud Run State

| Area | Result |
| --- | --- |
| Region checked | `us-central1` |
| Existing services | `reeditpro-api`, `reeditpro-staging-api`, `reeditpro-staging-private-searxng` |
| Qwen Cloud Run service exists | false |
| Cloud Run volume mount created now | false |
| Cloud Run deploy command executed | false |
| Cloud Run job created | false |
| Artifact Registry image created | false |

## Cost And GPU Carry Forward

The selected future runtime remains Cloud Run GPU with one NVIDIA L4, `minInstances=0`, `maxInstances=1`, `concurrency=1`, `8` CPU, and `32Gi` memory. That keeps the service scale-to-zero friendly so the GPU is not intended to stay running when idle. This packet does not start the service and does not incur GPU runtime from Cloud Run.

## Runtime Gates

- `privateCacheMountVerifyCreated=true`
- `finalPrivateCacheVerified=true`
- `finalPrivateCacheObjectCount=16`
- `finalPrivateCacheTotalBytes=16595981281`
- `prefixScopedReadIamBindingPresent=true`
- `runtimeIdentitySelected=true`
- `currentUserObjectMetadataRead=true`
- `currentUserPrefixInventoryRead=true`
- `cloudRunServiceAbsenceVerified=true`
- `impersonatedRuntimeReadPassed=false`
- `impersonatedRuntimeReadBlockedByTokenCreator=true`
- `policyTroubleshooterMembershipMatched=true`
- `policyTroubleshooterRolePermissionIncluded=true`
- `policyTroubleshooterConditionGranted=false`
- `cloudRunVolumeMountCreated=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `artifactRegistryImageCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
- `dockerBuildRun=false`
- `dockerPushRun=false`
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

## Remaining Blockers

- No Cloud Run service exists for Qwen2.5-VL 7B.
- No Cloud Run private model-cache volume mount exists yet.
- Runtime identity data-plane read was not impersonation-proven because TokenCreator is intentionally absent.
- Policy Troubleshooter did not grant the conditional binding in its object-context probe, despite matching membership and role permission.
- No Cloud Storage FUSE compatibility proof has run.
- No startup local-copy strategy has been executed.
- No vLLM or SGLang runtime has been started on Cloud Run.
- No model import, model load, inference, generated fixture, beta route, or production route is approved.
- No worker queue dispatch, approved snapshot execution, QA row, or credit gate has been used.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_22-CLOUD-RUN-GPU-NO-DEPLOY-MOUNT-SPEC: author Cloud Run service revision mount/IAM spec with completed private cache, no deploy/no inference`
