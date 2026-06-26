# Qwen2.5-VL 7B Cloud Run GPU Quota Preflight Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_quota_preflight_passed_ready_for_container_readiness_spec_no_deploy`

This packet records a read-only Cloud Run GPU quota and prerequisite preflight for the Qwen2.5-VL 7B scale-to-zero service spec. The preflight verifies that the preferred `us-central1` Cloud Run L4 path has enough no-zonal-redundancy L4 quota for the proposed max instances `1`.

This packet does not deploy Cloud Run, create a Cloud Run service or job, build Docker, push images, create Artifact Registry artifacts, create VMs, create reservations, run inference, import models, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md`
- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`

## Read-only Preflight Findings

| Area | Finding |
| --- | --- |
| Project | `reeditpro` |
| Preferred region | `us-central1` |
| Cloud Run API | enabled |
| Artifact Registry API | enabled |
| Compute Engine API | enabled |
| Cloud Run L4 no-zonal-redundancy quota metric | `run.googleapis.com/nvidia_l4_gpu_allocation_no_zonal_redundancy` |
| Cloud Run L4 no-zonal-redundancy quota ID | `NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion` |
| `us-central1` no-zonal-redundancy quota value | `3` |
| Proposed max instances | `1` |
| Quota sufficient for proposed proof | yes |
| Cloud Run L4 zonal-redundancy quota metric | `run.googleapis.com/nvidia_l4_gpu_allocation` |
| Zonal-redundancy quota value visible | no region-specific value found |
| Service name collision | absent for `reeditpro-qwen2-5-vl-l4-worker` in `us-central1` |
| Artifact Registry repo | `reeditpro-workers` Docker repo exists in `us-central1` |
| Candidate production worker service account | `sa-ai-video-asset-worker` present |
| Candidate staging GPU worker service account | `reeditpro-stg-gpu-worker-sa` present |
| Active Compute reservations | none |

## Preflight Decision

The Cloud Run L4 no-zonal-redundancy path is ready for a no-build/no-deploy container readiness spec.

The future service spec should keep:

- region `us-central1`;
- GPU type `nvidia-l4`;
- GPU count `1`;
- min instances `0`;
- max instances `1`;
- concurrency `1`;
- CPU/memory candidate `8 CPU / 32 GiB`;
- no public unauthenticated access;
- backend-only invocation;
- no-zonal-redundancy for first cost-focused proof;
- fallback to ephemeral Compute Engine L4 worker if Cloud Run container/model-cache constraints fail.

## Remaining Blockers Before Deploy

- No Qwen Cloud Run container image exists.
- No Qwen Cloud Run container readiness spec exists.
- No model-cache mounting, baking, or private pull strategy is approved for Cloud Run.
- No cold-start/import proof exists on Cloud Run.
- No private invocation IAM binding plan is approved.
- No queue dispatch implementation exists.
- No service deploy prompt is approved.
- No model inference proof is approved.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=false`
- `cloudRunDeployCommandExecuted=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `dockerBuildRun=false`
- `dockerPushRun=false`
- `artifactRegistryImageCreated=false`
- `reservationCreated=false`
- `vmCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_14-CLOUD-RUN-GPU-CONTAINER-READINESS-SPEC: define Qwen Cloud Run container and model-cache readiness, no build/no deploy/no inference`
