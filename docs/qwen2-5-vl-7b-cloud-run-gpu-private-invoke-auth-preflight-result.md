# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Auth Preflight Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_blocked_gcloud_reauth_no_invocation`

This packet records a read-only private invocation auth preflight for the Qwen2.5-VL Cloud Run GPU service. Local Google Cloud SDK discovery succeeded, the configured project is `reeditpro`, and an active account is configured. Cloud Run and IAM inspection could not proceed because the current gcloud auth session requires interactive reauthentication.

This packet does not run interactive login, fetch an identity token, resolve a service URL, invoke Cloud Run, update IAM, create IAM bindings, create service account keys, submit dispatch, claim a real lease, heartbeat a real worker, import Qwen, load Qwen, initialize vLLM, run a forward pass, run inference, process media, call providers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-config-smoke-result.ts`
- `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-config.ts`

## Read-Only Commands Attempted

| Command class | Result |
| --- | --- |
| `gcloud --version` | succeeded |
| `gcloud config get-value project` | succeeded with `reeditpro` |
| `gcloud auth list` | succeeded; active account is configured |
| `gcloud config list` | succeeded; emitted a project environment tag warning |
| Cloud Run service describe | blocked by interactive reauthentication requirement |
| Cloud Run service IAM policy read | blocked by interactive reauthentication requirement |
| Runtime service account describe | blocked by interactive reauthentication requirement |
| Project IAM policy read for Cloud Run invoker | blocked by interactive reauthentication requirement |

The environment tag warning was not acted on in this packet because this is a no-mutation preflight.

## Preflight Findings

| Area | Finding |
| --- | --- |
| Google Cloud SDK | available |
| Active project | `reeditpro` |
| Active account configured | true |
| Cloud Run service target | `reeditpro-qwen2-5-vl-l4-worker` |
| Region | `us-central1` |
| Runtime identity target | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Cloud Run service describe | blocked |
| Cloud Run IAM policy read | blocked |
| Runtime identity describe | blocked |
| Project invoker policy read | blocked |
| Auth blocker | interactive reauthentication required |
| Ready for private invocation | false |

## Required Evidence Still Missing

- Cloud Run service exists and current revision/service account/ingress settings are confirmed by read-only describe.
- Cloud Run service IAM policy is read without mutation.
- Approved backend caller identity is identified.
- Minimal Cloud Run invoker grant is confirmed for the approved caller identity only.
- Runtime service account is confirmed enabled.
- No unauthenticated invoker binding is present.
- No public ingress relaxation is present.

## Runtime Gates

- `privateInvokeAuthPreflightAttempted=true`
- `gcloudAvailable=true`
- `gcloudProjectVerified=true`
- `gcloudAuthListRead=true`
- `gcloudConfigListRead=true`
- `cloudRunServiceDescribeSucceeded=false`
- `cloudRunIamPolicyReadSucceeded=false`
- `runtimeServiceAccountDescribeSucceeded=false`
- `projectInvokerPolicyReadSucceeded=false`
- `authSessionRequiresReauthentication=true`
- `privateInvokeAuthPreflightPassed=false`
- `readyForPrivateInvocation=false`
- `interactiveAuthRun=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `iamBindingCreated=false`
- `serviceAccountKeyCreated=false`
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

- The local Google Cloud SDK is installed.
- The configured project is `reeditpro`.
- A gcloud account is configured locally.
- Read-only Cloud Run and IAM inspection is currently blocked by interactive reauthentication.
- No identity token was fetched and no Cloud Run invocation was attempted.

## What This Does Not Prove

- It does not prove Cloud Run service state.
- It does not prove Cloud Run IAM policy.
- It does not prove service account readiness.
- It does not prove invoker permission for a backend caller.
- It does not prove audience resolution, token acquisition, or private invocation.
- It does not prove model import, model load, vLLM startup, forward pass, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_38-BLOCKED-GCLOUD-REAUTH: refresh gcloud auth session for read-only IAM preflight, no invocation`
