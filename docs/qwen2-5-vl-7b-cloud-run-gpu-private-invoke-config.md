# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Config Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation`

This packet defines the backend-only configuration contract for future private Cloud Run invocation by the Qwen2.5-VL fail-closed dispatch adapter. It adds an importable worker config contract and validation helper, but it does not read environment values, resolve the service URL, resolve the audience, fetch an identity token, invoke Cloud Run, or enable inference.

This packet does not run `gcloud`, update Cloud Run, invoke Cloud Run, fetch an identity token, create an IAM binding, create a service account key, dispatch a worker, claim a real lease, heartbeat a real worker, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- `src/backend/workers/index.ts`

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

This config contract stops before private Cloud Run invocation.

## Config Contract

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Auth mode | `google_signed_identity_token_backend_only` |
| Timeout | `300000ms` |
| Max body bytes | `65536` |
| Invocation enabled now | false |
| Retries enabled now | false |
| Service URL stored in repo | false |
| Audience resolved now | false |

## Allowed Backend Config Keys

The contract only names future backend config keys. It does not read them in this packet.

- `QWEN25_VL_CLOUD_RUN_PROJECT`
- `QWEN25_VL_CLOUD_RUN_REGION`
- `QWEN25_VL_CLOUD_RUN_SERVICE`
- `QWEN25_VL_CLOUD_RUN_AUDIENCE_SOURCE`
- `QWEN25_VL_CLOUD_RUN_TIMEOUT_MS`
- `QWEN25_VL_CLOUD_RUN_MAX_BODY_BYTES`
- `QWEN25_VL_CLOUD_RUN_INVOCATION_ENABLED`

## Forbidden Config Values

- Concrete service URL values.
- Checked-in identity tokens.
- Checked-in key material.
- Public invocation flags.
- Frontend-exposed runtime config.
- Provider or billing credentials.

## Validation Rules

The config validator accepts a candidate only when:

- project, region, and service match the deployed Qwen service;
- auth mode is backend-only Google-signed identity token;
- audience resolution is backend-only;
- service URL resolution is backend-only;
- no concrete service URL is stored in repo data;
- invocation is disabled now;
- retries are disabled now;
- timeout stays within the planned bound;
- max body bytes match the Qwen runtime contract.

Unsafe candidates are rejected before any runtime can use them.

## Runtime Flags

- `privateInvokeConfigContractDefined=true`
- `configValidationImplemented=true`
- `validConfigCandidateAcceptedForFutureRuntime=true`
- `unsafeConfigCandidatesRejected=true`
- `configValuesReadNow=false`
- `serviceUrlStoredInRepo=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
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

- Qwen has an importable backend-only private invocation config contract.
- Future config keys are named without reading values.
- Valid future config candidates can be structurally accepted.
- Unsafe candidates that enable invocation or store service URL values are rejected.
- All runtime side-effect gates remain closed.

## What This Does Not Prove

- It does not prove live configuration values.
- It does not prove IAM configuration.
- It does not prove ID token acquisition.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_37-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG-SMOKE: run private invocation config contract smoke, no invocation`
