# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Plan

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_transport_planned_no_invocation`

This packet defines the future private Cloud Run invocation transport shape for the Qwen2.5-VL fail-closed dispatch adapter. It records the target service, caller requirements, authenticated request rules, ingress policy, backend-only configuration requirements, and side-effect gates without invoking Cloud Run or enabling inference.

This packet does not run `gcloud`, update Cloud Run, invoke Cloud Run, fetch an identity token, create an IAM binding, create a service account key, dispatch a worker, claim a real lease, heartbeat a real worker, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- Google Cloud Run service-to-service authentication documentation
- Google Cloud Run ingress restriction documentation

## Future Transport Path

Raw chat must not become a worker input. The future execution path remains:

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ credit reservation
→ queue lease / worker contract
→ bounded Qwen runtime request
→ private Cloud Run invocation
```

This plan stops before private Cloud Run invocation.

## Target Service

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| GPU | `1 x nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
| Min instances | `0` |
| Max instances | `1` |
| Concurrency | `1` |
| Timeout | `900s` |
| Public unauthenticated access | disabled |
| Ingress | `internal-and-cloud-load-balancing` |
| Service URL | redacted and backend-only |

The service remains cost-focused and scale-to-zero oriented.

## Future Auth Requirements

The future backend caller must:

- run from a backend-controlled runtime;
- use a privileged runtime identity that has the minimal Cloud Run invoker permission for this service;
- obtain a Google-signed identity token at runtime;
- set the token audience to the receiving Cloud Run service URL or an approved custom audience;
- send the token through the serverless auth header path expected by Cloud Run;
- never store tokens, keys, credentials, or resolved service URLs in frontend code or mock payloads;
- never use a checked-in key file;
- never grant unauthenticated access;
- keep service ingress restricted.

This packet does not create IAM bindings or fetch tokens.

## Future Request Shape

The future transport request must be derived from the approved-snapshot runtime payload:

- method: `POST`
- path: root service handler
- content type: JSON
- max body bytes: `65536`
- body: `qwen2_5_vl_cloud_run_gpu_runtime_request_v1`
- auth: backend-acquired identity token
- retries: disabled until idempotent retry policy is approved
- timeout: bounded below the service timeout

The adapter must keep the request body free of raw prompt fields, signed URLs, public URLs, provider responses, service secrets, and user-supplied worker instructions.

## Invocation Prerequisites

Private invocation remains blocked until all of these are complete:

- Qwen-specific dispatch adapter is connected to a backend runtime route.
- Backend queue mutation and lease claim are transactional and idempotent.
- Credit reservation is verified before invocation.
- Approved plan snapshot hash is verified before invocation.
- Source-of-truth references resolve to private records and manifests.
- Cloud Run invoker permission is granted to the approved caller identity only.
- Service URL or custom audience is resolved from backend configuration only.
- Observability records dispatch attempt, request ID, response status, failure class, and retry decision.
- Failure handling can release or refund credits without double-spending.
- Runtime remains fail-closed when `modelInferenceEnabled=false`.

## Blocked Bypasses

- Direct frontend invocation.
- Unauthenticated invocation.
- Public ingress relaxation.
- Stored service account keys.
- Checked-in tokens or credentials.
- Signed URL source-of-truth payloads.
- Public URL media inputs.
- Raw prompt payloads.
- Generic mock dispatch completion as a substitute for Qwen runtime.
- Retry without idempotency.
- Credit spend without verified response handling.

## Runtime Flags

- `privateInvokePlanDefined=true`
- `targetServiceRecorded=true`
- `idTokenAudienceRequirementRecorded=true`
- `ingressRequirementRecorded=true`
- `iamInvokerRequirementRecorded=true`
- `serviceUrlStoredInRepo=false`
- `gcloudCommandRun=false`
- `iamBindingCreated=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `dispatchSubmitted=false`
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
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The Qwen dispatch adapter now has a private Cloud Run invocation transport plan.
- The plan preserves scale-to-zero L4 service settings.
- Future invocation must use backend-only authenticated Cloud Run calls.
- The service URL remains redacted and not stored in repo data.
- All runtime side-effect gates remain closed.

## What This Does Not Prove

- It does not prove IAM configuration.
- It does not prove ID token acquisition.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_36-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG: define backend-only private invocation config contract, no invocation`
