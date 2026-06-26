# Qwen2.5-VL 7B Cloud Run GPU Scale-to-zero Review

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_scale_to_zero_review_ready_for_no_deploy_service_spec`

This packet evaluates Cloud Run GPU as the preferred Qwen2.5-VL 7B on-demand runtime path. It does not deploy Cloud Run, build or push images, create Artifact Registry artifacts, create VMs, create reservations, run Docker, import models, run inference, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts`
- `docs/qwen2-5-vl-7b-l4-reservation-create-us-east4-a-result.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`
- `docs/qwen2-5-vl-7b-stack-tool-integration.md`
- `model-routing-policy.md`
- `intent-led-edit-planning.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `pricing-and-credits.md`

## Read-only GCP Findings

| Area | Finding |
| --- | --- |
| Project | `reeditpro` |
| Cloud Run API | enabled |
| Artifact Registry API | enabled |
| Compute Engine API | enabled |
| `gcloud run deploy` GPU flags | `--gpu`, `--gpu-type`, `--min-instances`, `--max-instances`, `--concurrency`, and `--timeout` visible |
| Existing Qwen Cloud Run services | none found |
| Active Compute reservations | none |
| Existing Artifact Registry Docker repos | `reeditpro-workers` in `us-central1`, `reeditpro-staging-workers` in `us-central1`, `reeditpro-runtime` in `us-east1`, `reeditpro-runtime` in `europe-west1` |

## Official Cloud Run GPU Fit Evidence

Official Cloud Run documentation supports the fit review:

- Cloud Run GPU services can scale down to zero when not in use.
- Cloud Run GPU offers on-demand availability without reservations.
- Cloud Run supports one GPU per service instance.
- Cloud Run supports NVIDIA L4 with preinstalled NVIDIA driver/CUDA runtime.
- L4 requires at least 4 CPU and 16 GiB memory.
- 8 CPU and 32 GiB memory is a better Qwen beta candidate when model load headroom matters.
- GPU services require instance-based billing; min instances would be charged while idle, so ReEditPro must keep min instances `0` unless a future production traffic review approves warm capacity.
- L4-supported Cloud Run regions include `us-central1`, `us-east4`, `europe-west1`, `europe-west4`, `asia-southeast1`, and invite-only `asia-south1`.

## Fit Decision

Cloud Run GPU is conditionally selected for the next no-deploy service spec because it best matches the user requirement: Qwen should run when used and stop or scale to zero when idle.

| Area | Decision |
| --- | --- |
| Preferred runtime path | Cloud Run GPU scale-to-zero |
| Preferred review region | `us-central1` |
| Region rationale | L4-supported, existing Cloud Run services, existing Artifact Registry worker repos |
| Secondary region | `us-east4` |
| Secondary rationale | L4-supported and previously inspected for Qwen L4 quota/capacity |
| Tertiary region | `europe-west1` |
| Tertiary rationale | L4-supported and existing Artifact Registry runtime repo |
| GPU type | `nvidia-l4` |
| CPU/memory proof floor | 4 CPU and 16 GiB |
| Qwen beta candidate | 8 CPU and 32 GiB |
| Min instances | `0` |
| Max instances | `1` until beta load evidence |
| Concurrency | `1` until model memory/concurrency proof |
| Public unauthenticated access | rejected |
| Always-on GPU | rejected |
| Long-held idle reservation | rejected |
| Runtime deployment now | false |

## Cloud Run No-deploy Service Spec Requirements

The next prompt must author a no-deploy service spec with:

- service name `reeditpro-qwen2-5-vl-l4-worker`;
- preferred region `us-central1`;
- GPU type `nvidia-l4`;
- GPU count `1`;
- min instances `0`;
- max instances `1`;
- concurrency `1`;
- CPU/memory candidate `8 CPU / 32 GiB` for beta smoothness, with proof floor `4 CPU / 16 GiB`;
- request timeout and startup probe plan;
- backend-only authenticated invocation;
- no public unauthenticated ingress;
- no secrets in image or frontend;
- private model cache strategy;
- no signed URL source of truth;
- no raw chat worker payload;
- queue lease/idempotency requirement;
- approved snapshot and credit gate requirement;
- fallback to ephemeral Compute Engine L4 worker if Cloud Run GPU image/model constraints fail.

## Blockers Before Deploy

- No Cloud Run Qwen container image exists.
- No Qwen Cloud Run service spec exists yet.
- No model-cache mounting or download strategy has been approved for Cloud Run.
- No Cloud Run GPU quota proof has been run.
- No cold-start/import proof has been run on Cloud Run.
- No private invocation/IAM spec has been approved.
- No queue dispatch integration exists.
- No credit-gated production billing path is implemented.

## Tool Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It ranks above generic VLM fallback for source-frame understanding, OCR/layout QA, caption/visual collision QA, product/demo step understanding, b-roll relevance scoring, and generated asset visual QA. Qwen is not a generated-video route. Wan remains generated B-roll primary, Hailuo remains fallback, and Veo remains Premium-only final fallback/rescue.

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

`QWEN2_5_VL_STACK_TOOL_12-CLOUD-RUN-GPU-NO-DEPLOY-SERVICE-SPEC: author Qwen scale-to-zero Cloud Run service spec, no deploy/no inference`
