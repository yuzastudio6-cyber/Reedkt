# Qwen2.5-VL 7B Idle GPU Lifecycle Plan

## Status

Decision: `qwen2_5_vl_7b_idle_gpu_lifecycle_plan_ready_for_cloud_run_gpu_scale_to_zero_review`

This packet defines the cost-friendly Qwen2.5-VL 7B GPU lifecycle for ReEditPro. The model must run only when ReEditPro has approved queued work, then stop or scale to zero when idle. The default runtime must not be an always-on GPU VM and must not hold long-lived idle GPU capacity.

This plan creates no Cloud Run service, Cloud Run job, Compute Engine VM, reservation, disk, image, bucket, Artifact Registry artifact, worker job, provider call, model import, model inference, generated media, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/qwen2-5-vl-7b-l4-reservation-create-us-east4-a-result.md`
- `docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md`
- `docs/qwen2-5-vl-7b-stack-tool-integration.md`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`
- `model-routing-policy.md`
- `intent-led-edit-planning.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `pricing-and-credits.md`

## Runtime Lifecycle Decision

| Area | Decision |
| --- | --- |
| Selected GPU | NVIDIA L4 on Google Cloud G2 remains selected |
| Always-on GPU | rejected |
| Long-held idle reservation | rejected as the default |
| Run trigger | approved queued Qwen visual-understanding, planning, or QA work item |
| Stop trigger | idle timeout, max runtime cap, queue drain, failure cleanup, or operator stop |
| Preferred path | Cloud Run GPU scale-to-zero review |
| Fallback path | ephemeral Compute Engine L4 worker with idle teardown |
| First proof shape | `g2-standard-4` for import-smoke if accepted by the future proof |
| Beta serving shape | `g2-standard-8` or Cloud Run GPU equivalent after cold-start and memory proof |
| Active worker cap | one L4 worker until beta evidence says otherwise |
| Model inference in this packet | false |

Official Google Cloud documentation says Cloud Run GPU services can scale down to zero when not in use, and Compute Engine GPU cost stops when the GPU VM is stopped or deleted while persistent disks still bill. This packet records that evidence as planning input only; it does not create or run either runtime.

## Preferred Path: Cloud Run GPU Scale-to-zero Review

Cloud Run GPU is the preferred cost-control review path because it aligns with the user requirement: run Qwen when requests exist and scale to zero when idle.

Before this path can be implemented, a future prompt must prove:

- Qwen2.5-VL 7B container size and startup time are acceptable.
- Private model cache strategy is approved and does not expose model artifacts publicly.
- Linux L4 wheelhouse can be packaged or mounted without installing dependencies at request time.
- Region has L4 Cloud Run GPU availability and quota.
- Service can use min instances `0`.
- max instances starts at `1`.
- Concurrency, request timeout, and memory are safe for one model worker.
- Access is private/backend-only, not a public anonymous endpoint.
- Idle scale-down and cleanup are observable.
- Credit/approval gates exist before request dispatch.

Cloud Run GPU review remains blocked for runtime execution until a future prompt creates a no-execution service spec, then a bounded proof with cleanup.

## Fallback Path: Ephemeral Compute Engine L4 Worker

If Cloud Run GPU cannot safely host Qwen2.5-VL 7B because of container size, cold-start, model-cache, region quota, timeout, or private networking constraints, use an ephemeral Compute Engine L4 worker.

The fallback worker must:

- create a no-public-IP L4 VM only after an approved queued work item exists;
- use the proof service account or a future least-privilege Qwen worker service account;
- attach only private boot/model cache storage approved for the proof;
- process one queue lease at a time;
- enforce an idle timeout of `600` seconds for proof and beta default;
- enforce a max runtime cap of `1800` seconds for proof;
- delete or stop the VM after queue drain, idle timeout, failure, or operator stop;
- verify no disk, address, reservation, or VM remains unless a later approved persistent-cache policy says otherwise;
- never execute raw chat as a worker payload.

## Tool-call Ranking

| Rank | Use case | Qwen2.5-VL role | Better route when applicable |
| --- | --- | --- | --- |
| 1 | source-frame visual understanding | primary visual-language tool | deterministic metadata when enough |
| 2 | OCR/layout readability QA | primary advisory QA tool | deterministic OCR/layout tool when exact extraction is required |
| 3 | caption and visual collision QA | primary advisory QA tool | Remotion/layout validators for exact frame math |
| 4 | product/demo step understanding | primary visual planner support | transcript/tool logs when authoritative |
| 5 | b-roll relevance scoring | advisory ranker | Wan/Hailuo generate only after plan approval |
| 6 | generated asset QA | advisory reviewer | deterministic media QA for exact measurements |
| 7 | unsafe or unclear visual claims | escalate to human review | documentary/fact-safety policy |
| 8 | generated video creation | not owned by Qwen | Wan primary, Hailuo fallback, Veo Premium final fallback only |

Qwen is a visual understanding, planning, and QA stack tool. It is not the AI-video generation model, not the final compositor, not the provider fallback, and not a substitute for approved snapshots, credit estimates, or worker contracts.

## Work Item Contract

Every future Qwen GPU job must include:

- approved plan snapshot ID or explicit bounded proof scope;
- compiled intent reference;
- structured visual-understanding task type;
- source asset references, not public URLs;
- idempotency key;
- queue lease ID;
- expected outputs as metadata/QA findings, not generated media;
- cost cap and credit estimate reference before production use;
- cleanup policy and max runtime;
- no raw chat payload;
- no signed URL source of truth;
- no public artifact output.

## Idle And Cleanup Policy

| Control | Proof default | Beta default |
| --- | --- | --- |
| Min active GPU workers | `0` | `0` |
| Max active GPU workers | `1` | `1` until load evidence |
| Idle timeout | `600` seconds | `600` seconds unless metrics justify change |
| Max runtime | `1800` seconds | job-class dependent with hard cap |
| Queue drain behavior | stop/delete worker | scale to zero or delete worker |
| Failure behavior | cleanup first, then report | cleanup first, then retry/fallback policy |
| Billing behavior | no idle GPU billing target | no idle GPU billing target |

## Forbidden Work

- Do not create a VM.
- Do not create a reservation.
- Do not create a Cloud Run service or job.
- Do not build or push Docker images.
- Do not start a GPU service.
- Do not run inference.
- Do not install dependencies on a VM.
- Do not import Qwen on a GPU runtime.
- Do not call `from_pretrained`.
- Do not call `torch.load`.
- Do not start `vllm serve`.
- Do not start SGLang.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not generate media or assets.
- Do not create public artifacts.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Runtime Gates

- `gcpMutatingCommandsExecuted=false`
- `reservationCreated=false`
- `vmCreated=false`
- `cloudRunServiceCreated=false`
- `cloudRunJobCreated=false`
- `dockerBuildRun=false`
- `artifactRegistryImageCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_11-CLOUD-RUN-GPU-SCALE-TO-ZERO-REVIEW: evaluate Qwen Cloud Run GPU scale-to-zero fit, no deploy/no inference`
