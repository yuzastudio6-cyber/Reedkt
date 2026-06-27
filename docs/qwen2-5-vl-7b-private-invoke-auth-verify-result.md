# QWEN2_5_VL 7B Private Invoke Auth Verify Result

## Status

Decision: `qwen2_5_vl_private_invoke_auth_verify_result_blocked_gcloud_reauth_no_invocation`

The guarded private-invocation auth preflight was run with explicit confirmation in read-only mode. It did not fetch identity tokens, invoke Cloud Run, update IAM, create service-account keys, dispatch workers, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, mutate Supabase, execute SQL, create generated assets, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Target

| Area | Value |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |

## Verification Run

| Field | Value |
| --- | --- |
| Run ID | `qwen25-private-invoke-auth-20260627T060925` |
| Runner mode | `read_only_gcloud_describe_only` |
| Result | `blocked` |
| Blocked reason | `gcloud_auth_session_requires_interactive_reauthentication` |

## Passed Read-Only Checks

- `gcloud_version`
- `active_project`
- `active_account`

The active project check returned `reeditpro`. The active account check found an account for the `reeditpro.com` domain.

## Blocked Read-Only Checks

- `cloud_run_service_describe`
- `cloud_run_service_iam_policy`
- `runtime_service_account_describe`
- `project_invoker_policy_read`

These checks were blocked because the local gcloud session requires interactive reauthentication and the runner is non-interactive.

## Runtime Flags

- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `iamBindingCreated=false`
- `dispatchSubmitted=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`

## What This Proves

- The guarded preflight runner can execute safely without token fetch or service invocation.
- Local gcloud tooling is present.
- The active gcloud project is `reeditpro`.
- The auth session is not currently sufficient for read-only Cloud Run and IAM verification.

## What This Does Not Prove

- It does not prove Cloud Run service state.
- It does not prove IAM policy.
- It does not prove private invocation readiness.
- It does not prove model import, model load, vLLM startup, forward pass, or inference readiness.
- It does not prove beta or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_44-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation`
