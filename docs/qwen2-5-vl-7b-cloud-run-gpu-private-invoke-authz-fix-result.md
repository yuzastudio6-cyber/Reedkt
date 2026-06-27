# Qwen2.5-VL 7B Private Invoke Authz Fix Result

Decision: `qwen2_5_vl_private_invoke_authz_fixed_blocked_unexpected_404_no_inference`.

Mode: `qwen2_5_vl_private_invoke_authz_fix_result`.

This packet records the narrow authorization fix for the Qwen2.5-VL 7B controlled private invoke smoke. The active operator received service-account-level TokenCreator permission on the Qwen runtime service account, and the Qwen runtime service account received service-level Cloud Run Invoker permission on the Qwen worker service. No service-account key was created, no broad project role was added, no public invoker was added, and no beta or production readiness is claimed.

After IAM propagation, the guarded smoke successfully minted an audience-bound identity token through non-key service-account impersonation. The token value was not printed or stored. The smoke then sent exactly one authenticated contract `POST /` request with the approved-snapshot local queue fixture. The response was HTTP `404` with no expected JSON contract body, so the runtime contract was not reached and the smoke remains blocked.

No model import ran, no model load ran, no vLLM engine initialized, no forward pass ran, no inference ran, no worker was dispatched, no Supabase mutation occurred, no SQL executed, no generated asset was created, no public artifact was created, no signed URL was created, no credit mutation occurred, and no beta or production readiness was claimed.

## Files

- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts`
- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-authz-fix-result.ts`
- `server/smoke/qwen2-5-vl-private-invoke-authz-fix-result-smoke.ts`

## IAM Changes Applied

| Binding | Scope | Member | Result |
| --- | --- | --- | --- |
| `roles/iam.serviceAccountTokenCreator` | Qwen runtime service account | active operator user | added |
| `roles/run.invoker` | Qwen Cloud Run worker service | Qwen runtime service account | added |

Blocked IAM changes:

- broad project role added: `false`
- service-account key created: `false`
- public invoker added: `false`

## Run

- run id: `qwen25-private-invoke-smoke-20260627T113052`
- preflight run id: `qwen25-private-invoke-auth-20260627T101708`
- auth reverify run id: `qwen25-private-invoke-auth-20260627T095446`
- token-path fix run id: `qwen25-private-invoke-smoke-20260627T111828`
- status: `blocked`
- blocker: `private_invoke_response_unexpected`

## Probe Summary

| Probe | Status | Result |
| --- | --- | --- |
| `service_account_iam_policy` | passed | Runtime service-account policy includes user-scoped TokenCreator binding. |
| `cloud_run_service_iam_policy` | passed | Cloud Run service policy includes runtime service-account invoker binding. |
| `identity_token_fetch` | passed | `identity_token_fetched=true`; token value stored false; token output printed false. |
| `cloud_run_contract_post` | blocked | Authenticated `POST /` returned HTTP `404`, not the expected fail-closed contract response. |
| `cloud_run_revision_logs` | blocked | No Cloud Run revision log rows were observed for the bounded smoke timestamp window. |

## Token Path Finding

- `audienceBoundIdentityTokenRequired=true`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `serviceAccountImpersonationConfigured=true`
- `serviceAccountImpersonationAttempted=true`
- `tokenCreatorPermissionEffectiveAfterPropagation=true`
- `serviceAccountKeyCreated=false`
- `authHeaderCreated=true`

## Smoke Response

- method: `POST`
- path: `/`
- body source: `approved_snapshot_local_queue_fixture`
- body byte length: `1714`
- max body bytes: `65536`
- retry attempted: `false`
- expected HTTP status: `403`
- actual HTTP status: `404`
- expected reason: `qwen_inference_disabled_after_contract_check`
- actual reason: `non_json_or_missing_reason`
- contract satisfied for future runtime: `false`
- model inference enabled: `false`
- runtime contract executes now: `false`
- response classification: `blocked_unexpected_runtime_response`

## Routing Finding

The token and service IAM boundary now works, but the authenticated request did not reach the expected fail-closed service contract handler. Because no revision logs were observed for the smoke timestamp window, the likely next investigation is Cloud Run ingress, private route, load balancer, proxy, or service URL/audience reachability. The next fix must preserve the same one-request/no-retry/no-inference/no-output posture.

## Runtime Gates

- `serviceUrlResolvedNow=true`
- `serviceUrlValueStored=false`
- `audienceResolvedNow=true`
- `audienceValueStored=false`
- `authHeaderCreated=true`
- `identityTokenFetched=true`
- `identityTokenPrinted=false`
- `identityTokenValueStored=false`
- `cloudRunInvocationAttempted=true`
- `serviceRuntimeRequestSent=true`
- `responseClassifiedLocally=true`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-ROUTING-FIX: fix controlled private invoke route/ingress contract response, no inference`
