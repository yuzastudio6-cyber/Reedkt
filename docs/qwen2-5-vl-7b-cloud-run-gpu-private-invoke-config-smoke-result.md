# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Config Smoke Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_smoke_passed_no_invocation`

This packet records the local-only smoke result for the Qwen2.5-VL private invocation config contract. The smoke imports the backend worker config contract, validates the deterministic future-safe config candidate, rejects unsafe candidates, checks the docs/change log/package script, and recursively scans the config data for forbidden runtime values.

This packet does not read environment values, resolve a service URL, resolve an audience, fetch an identity token, invoke Cloud Run, submit dispatch, claim a real lease, heartbeat a real worker, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log.md`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts`
- `server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke.ts`
- `package.json`

## Smoke Command

```bash
npm run smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config
```

## Smoke Coverage

| Area | Expected result |
| --- | --- |
| Config contract import | Backend worker config contract is importable |
| Package script | `smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config` points at the config smoke |
| Target service metadata | Project, region, and service match the planned Cloud Run service |
| Allowed config keys | Seven backend-only config key names are present |
| Valid candidate | Accepted for future runtime config only |
| Invocation-enabled candidate | Rejected with `invocation_must_stay_disabled` |
| Stored service URL candidate | Rejected with `service_url_value_must_not_be_stored` |
| Backend audience rule | Rejected if audience is not backend-resolved |
| Retry rule | Rejected if retries are enabled now |
| Body limit rule | Rejected if max body bytes drift from `65536` |
| Forbidden values | No concrete URLs, public hostnames, signed URL tokens, credential values, database URLs, or public storage endpoints |

## Recorded Smoke Summary

- `ok=true`
- `decision=qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- region: `us-central1`
- auth mode: `google_signed_identity_token_backend_only`
- `service=reeditpro-qwen2-5-vl-l4-worker`
- `region=us-central1`
- `configKeyCount=7`
- `validCandidateAcceptedForFutureRuntime=true`
- `unsafeConfigCandidatesRejected=true`
- `configValuesReadNow=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`

## Runtime Gates

- `privateInvokeConfigSmokePassed=true`
- `configContractImported=true`
- `configDocsChecked=true`
- `packageScriptChecked=true`
- `validCandidateAcceptedForFutureRuntime=true`
- `unsafeConfigCandidatesRejected=true`
- `forbiddenValuesRejected=true`
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

- The Qwen private invocation config contract is importable from the backend worker surface.
- Future backend config key names are deterministic and do not read values.
- The future-safe config candidate can be accepted structurally.
- Unsafe candidates are rejected before runtime use.
- The config surface stores no concrete service URL and fetches no identity token.

## What This Does Not Prove

- It does not prove live backend config values.
- It does not prove Cloud Run IAM bindings.
- It does not prove audience resolution.
- It does not prove identity token acquisition.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_38-CLOUD-RUN-GPU-PRIVATE-INVOKE-AUTH-PREFLIGHT: verify private Cloud Run IAM and service account preconditions, no token/no invocation`
