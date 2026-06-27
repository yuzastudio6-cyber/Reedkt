# Qwen2.5-VL 7B Private Invoke Auth Reverify Result

## Status

Mode: `qwen2_5_vl_private_invoke_auth_reverify_result_blocked_gcloud_reauth_no_invocation`.

Run ID: `qwen25-private-invoke-auth-20260627T074548`.

The guarded read-only auth reverify was attempted after the Qwen private-invoke envelope, response, dry-run coordinator, and mock API route contracts were added. The result remains blocked by local `gcloud` interactive reauthentication. No identity token was fetched, no service URL was resolved, no Cloud Run request was sent, no inference ran, no worker was dispatched, no Supabase mutation occurred, no SQL executed, no generated asset was created, and no beta or production readiness was claimed.

## Target

- project: `reeditpro`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- runtime identity: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Passed Read-Only Probes

- `gcloud_version`
- `active_project`
- `active_account`

The active project was verified as `reeditpro`. An active account was present under the `reeditpro.com` domain. The full active account value is not stored in this packet.

## Blocked Read-Only Probes

- `cloud_run_service_describe`
- `cloud_run_service_iam_policy`
- `runtime_service_account_describe`
- `project_invoker_policy_read`

Each blocked probe reported non-interactive gcloud reauthentication failure. The runner did not prompt for login, did not call `gcloud auth login`, did not fetch tokens, and did not invoke Cloud Run.

## Runtime Flags

- `tokenOutputPrinted=false`
- `serviceAccountKeyCreated=false`
- `serviceUrlResolvedNowByDefault=false`
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
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Readiness Decision

- private invocation auth verified: false
- Cloud Run service describe verified: false
- Cloud Run IAM policy verified: false
- runtime service account verified: false
- project invoker policy verified: false
- ready for private invocation smoke: false
- beta/production ready claimed: false

## Required Manual Step

The next action is still a user-side local gcloud auth refresh outside Codex. This packet does not include token material and does not authorize an invocation.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_50-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation`
