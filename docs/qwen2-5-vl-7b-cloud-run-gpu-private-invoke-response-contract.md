# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Response Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_response_contract_defined_no_runtime_mutation`.

This document records the backend-only private invocation response classifier for the Qwen2.5-VL 7B Cloud Run GPU worker. It is a contract and smoke surface only. It does not send a Cloud Run request, resolve a service URL, resolve an audience, create an auth header, fetch an identity token, run model inference, persist output, dispatch a worker, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Why This Exists

The current service can return a contract-aware fail-closed response. A future backend caller must not confuse that response with successful model output.

The classifier distinguishes:

- transport/auth blockers before a service response;
- oversized request responses;
- invalid JSON responses;
- runtime contract rejection responses;
- contract-satisfied but inference-disabled responses;
- unexpected runtime responses;
- future metadata-only visual understanding output shape.

## Current Fail-Closed Runtime Response

The current service can return:

- status category: `blocked_contract_valid_inference_disabled`
- service reason: `qwen_inference_disabled_after_contract_check`
- `contractSatisfiedForFutureRuntime=true`
- `modelInferenceEnabled=false`
- `runtimeContractExecutesNow=false`

This response proves the approved-snapshot runtime contract can be recognized by the service, but it is not model output and must not advance worker, credit, Supabase, generated asset, public artifact, signed URL, beta, or production state.

## Runtime Contract Rejection

The classifier treats `qwen_runtime_contract_rejected` as `blocked_runtime_contract_rejected`.

Rejected runtime contracts must not:

- create findings;
- persist output rows;
- spend credits;
- schedule retries without a future idempotency policy;
- create generated assets;
- create public artifacts;
- create signed URLs;
- mark a worker job successful.

## Future Metadata-Only Shape

A future success response must remain metadata-only and must include:

- `ok=true`
- schema version `qwen2_5_vl_cloud_run_gpu_runtime_request_v1`
- output kind `metadata_only_visual_understanding`
- findings array
- `generatedAssetCreated=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`
- `creditSpendCreated=false`

Even when this future shape is recognized, this classifier does not persist it, does not spend credits, does not mutate Supabase, and does not advance runtime state by itself.

## Runtime Gates

All runtime side effects remain closed:

- `runtimeCanAdvanceNow=false`
- `persistOutputAllowedNow=false`
- `creditSpendAllowedNow=false`
- `retryAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`

## Blocked Bypasses

The classifier blocks:

- treating a fail-closed inference-disabled response as model success;
- persisting output without an approved response contract;
- spending credit from a fail-closed response;
- retrying without an idempotency policy;
- creating generated assets from metadata-only visual understanding;
- creating public artifacts from private visual understanding metadata.

## Current Blocker

Private invocation verification still needs the user-side local `gcloud` session refreshed outside Codex. This response contract does not require that refresh and does not attempt private invocation.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_47-PRIVATE-INVOKE-REAUTH-VERIFY: rerun guarded private invoke auth verification after user gcloud reauth, no token/no inference`
