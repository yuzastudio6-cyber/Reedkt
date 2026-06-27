# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Auth Preflight Runner

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_runner_defined_no_invocation`

This packet adds a guarded backend CLI runner for future read-only Cloud Run and IAM preflight checks. The runner defaults to static report mode and runs no gcloud probes unless `--execute` is passed with `REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT=true`.

This packet does not refresh gcloud auth, fetch an identity token, resolve a service URL, invoke Cloud Run, update IAM, create IAM bindings, create service account keys, submit dispatch, claim a real lease, heartbeat a real worker, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md`

## Runner Commands

Default static report, no gcloud probes:

```bash
npm run qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight -- --json
```

Plan output, no gcloud probes:

```bash
npm run qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight:plan
```

Future read-only execution after auth is refreshed:

```bash
REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT=true npm run qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight -- --execute --json
```

## Target

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |

## Read-Only Probe IDs

- `gcloud_version`
- `active_project`
- `active_account`
- `cloud_run_service_describe`
- `cloud_run_service_iam_policy`
- `runtime_service_account_describe`
- `project_invoker_policy_read`

## Forbidden Runner Behavior

- Browser or interactive gcloud auth inside Codex.
- Identity-token fetch.
- Access-token print.
- Cloud Run invocation.
- IAM mutation.
- Service-account key creation.
- Service URL storage in repo data.
- Any model import, model load, vLLM startup, forward pass, or inference.

## Runtime Flags

- `authPreflightRunnerDefined=true`
- `defaultModeNonMutating=true`
- `requiresExplicitExecutionFlag=true`
- `requiresConfirmationEnv=true`
- `tokenOutputPrinted=false`
- `serviceAccountKeyCreated=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `iamBindingCreated=false`
- `dispatchSubmitted=false`
- `inferenceRun=false`
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

- Qwen has a reusable backend-only auth-preflight runner surface.
- Default runner mode is non-mutating and does not run gcloud probes.
- Future read-only execution requires an explicit CLI flag and env confirmation.
- The runner never fetches identity tokens and never invokes Cloud Run.

## What This Does Not Prove

- It does not prove the current gcloud auth session.
- It does not prove Cloud Run service state.
- It does not prove IAM policy.
- It does not prove private invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove beta or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_39-GCLOUD-REAUTH-VERIFY: refresh gcloud auth and run guarded read-only auth preflight, no token/no invocation`
