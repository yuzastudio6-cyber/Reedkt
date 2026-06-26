# Qwen2.5-VL 7B Cloud Run GPU No-deploy Service Spec

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_no_deploy_service_spec_ready_for_quota_preflight`

This packet authors the no-deploy Cloud Run service spec for Qwen2.5-VL 7B. It translates the scale-to-zero review into a concrete future service shape while keeping every runtime and mutation gate closed.

This packet does not deploy Cloud Run, create a Cloud Run service or job, build Docker, push images, create Artifact Registry artifacts, create VMs, create reservations, run inference, import models, start an API server, call providers, dispatch workers, touch Supabase, execute SQL, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts`
- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts`
- `docker/prod/vlm-sglang-runtime/README.md`
- `docker/prod/vlm-sglang-runtime/Dockerfile`
- `cloudbuild/vlm-sglang-runtime-phase39c.yaml`
- `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- `docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md`
- `docs/qwen2-5-vl-7b-private-model-download-result.md`

## Service Spec

| Field | Value |
| --- | --- |
| Service name | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime target | Cloud Run service |
| Deployment status | no-deploy spec only |
| Region | `us-central1` |
| Secondary region | `us-east4` |
| Tertiary region | `europe-west1` |
| GPU type | `nvidia-l4` |
| GPU count | `1` |
| CPU | `8` |
| Memory | `32Gi` |
| Minimum proof floor | 4 CPU and 16 GiB |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Timeout candidate | `900s` |
| Startup probe | required before deploy |
| Zonal redundancy | disabled for first cost-focused proof unless future reliability review changes it |
| Invocation | backend-only authenticated invocation |
| Public unauthenticated access | rejected |
| Image | approved future Artifact Registry image only; no image exists now |
| Model cache | approved private model cache strategy required before deploy |
| Queue contract | lease and idempotency required |
| Output contract | metadata and QA findings only |

## Future Command Shape

The future deploy command must remain non-executable until a later approved deploy prompt. The intended command shape is:

```text
gcloud run deploy reeditpro-qwen2-5-vl-l4-worker
  --project=reeditpro
  --region=us-central1
  --image=APPROVED_FUTURE_QWEN_IMAGE_PLACEHOLDER
  --gpu=1
  --gpu-type=nvidia-l4
  --cpu=8
  --memory=32Gi
  --min-instances=0
  --max-instances=1
  --concurrency=1
  --timeout=900
  --no-allow-unauthenticated
  --execution-environment=gen2
  --no-gpu-zonal-redundancy
```

The command above is a shape only. It must not be run from this packet.

## Existing Runtime Boundary

The repo already has a VLM/SGLang runtime lane under `docker/prod/vlm-sglang-runtime/`. That lane is staging/job-oriented and explicitly contains runtime dependencies and worker code only, not model weights, tokenizer payloads, generated fixtures, secrets, credentials, or production service code.

The Qwen Cloud Run service spec must not duplicate that lane. It should reuse or extend the existing VLM runtime boundary only after a future container review decides whether Qwen should use:

- the existing SGLang runtime lane;
- a Qwen-specific vLLM runtime lane;
- a Qwen-specific SGLang runtime lane;
- an ephemeral Compute Engine L4 fallback.

## Required Environment Variables

Future service environment must remain fail-closed by default:

| Name | Required value before deploy |
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

No API keys, service-role keys, database URLs, provider credentials, model tokens, signed URL tokens, or raw secrets may be placed in environment variables.

## Work Item Payload Contract

Future requests must include structured metadata only:

- approved plan snapshot ID;
- compiled intent ID;
- visual-understanding task type;
- source asset manifest references;
- queue lease ID;
- idempotency key;
- max runtime;
- expected metadata/QA finding schema;
- cleanup and retry policy.

Future requests must reject:

- raw chat as worker instruction;
- public URLs as source of truth;
- signed URLs as source of truth;
- direct provider transport;
- generated video creation;
- final render/export execution;
- credit spend without approval.

## Deploy Blockers

- No Qwen Cloud Run image exists.
- No Cloud Run L4 quota preflight has been recorded.
- No container size/cold-start proof exists.
- No model cache strategy is approved for Cloud Run.
- No private invocation/IAM spec is approved.
- No queue dispatch implementation exists.
- No service deploy is approved.
- No model inference proof is approved.

## Runtime Gates

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

`QWEN2_5_VL_STACK_TOOL_13-CLOUD-RUN-GPU-QUOTA-PREFLIGHT: verify Qwen Cloud Run L4 quota and deploy prerequisites, no deploy/no inference`
