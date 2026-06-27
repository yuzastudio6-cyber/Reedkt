# Qwen2.5-VL 7B Private Invoke Token Path Fix Result

Decision: `qwen2_5_vl_private_invoke_smoke_blocked_token_creator_permission_required_no_request`.

Mode: `qwen2_5_vl_private_invoke_token_path_fix_result`.

This packet records the controlled token-path fix for the Qwen2.5-VL 7B private invoke smoke. The smoke runner now supports the repo-approved non-key impersonation path through `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT` or configured gcloud impersonation, validates service-account email shape, redacts the impersonation target and service audience from command summaries, and still requires the explicit execution flag plus confirmation environment variable.

The fixed runner was exercised once with explicit service-account impersonation. It stopped at identity-token minting because the active caller does not have `iam.serviceAccounts.getAccessToken` / `roles/iam.serviceAccountTokenCreator` for the runtime service account. No identity token was fetched, no auth header was created, no Cloud Run request was sent, no GPU instance was invoked by this smoke, and no inference ran.

## Files

- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts`
- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-token-path-fix-result.ts`
- `server/smoke/qwen2-5-vl-private-invoke-token-path-fix-result-smoke.ts`

## Run

- run id: `qwen25-private-invoke-smoke-20260627T111828`
- preflight run id: `qwen25-private-invoke-auth-20260627T101708`
- auth reverify run id: `qwen25-private-invoke-auth-20260627T095446`
- status: `blocked`
- blocker: `token_creator_permission_required`

The sanitized token command shape was:

```text
gcloud --quiet --impersonate-service-account redacted_not_stored auth print-identity-token --audiences redacted_not_stored
```

## Probe Summary

| Probe | Status | Result |
| --- | --- | --- |
| `gcloud_version` | passed | Google Cloud SDK available. |
| `active_project` | passed | Active project is `reeditpro`. |
| `cloud_run_service_describe` | passed | Service describe passed; service URL was resolved only in memory; value stored false; ingress internal and Cloud Load Balancing; template max scale `1`; service max scale `3`. |
| `identity_token_fetch` | blocked | Service-account impersonation was attempted, but `iam.serviceAccounts.getAccessToken` is denied. |

## Token Path Finding

- `audienceBoundIdentityTokenRequired=true`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `activeUserAudienceTokenBlocked=true`
- `serviceAccountImpersonationConfigured=true`
- `serviceAccountImpersonationAttempted=true`
- `tokenCreatorPermissionRequired=true`
- `serviceAccountKeyCreated=false`
- `authHeaderCreated=false`
- `cloudRunRequestSent=false`

## Cost And Runtime Posture

- selected GPU: `nvidia_l4`
- minimum scale annotation present: `false`
- template max scale: `1`
- service max scale: `3`
- single request, no retry: `true`
- cost guard reviewed before invoke: `true`
- GPU instance invoked by this smoke: `false`

## Runtime Gates

- `serviceUrlResolvedNow=true`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=true`
- `audienceValueStored=false`
- `authHeaderCreated=false`
- `identityTokenFetched=false`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `responseClassifiedLocally=false`
- `retryAttempted=false`
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

## Required Next Step

The next step is an authorization/token-path fix, not a model or GPU implementation step. A future owner-approved prompt must either grant the caller the narrow ability to mint an audience-bound identity token through `roles/iam.serviceAccountTokenCreator`, or define an attached-service-account token path that never uses service-account keys. That prompt must not enable inference, create assets, mutate IAM broadly, expose token values, mutate credits, or unlock beta/production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_52-AUTHZ-FIX-PRIVATE-INVOKE-SMOKE: approve TokenCreator or attached-service-account token path, no inference`
