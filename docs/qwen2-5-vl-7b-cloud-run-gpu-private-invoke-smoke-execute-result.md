# Qwen2.5-VL 7B Cloud Run GPU Private Invoke Smoke Execute Result

Decision: `qwen2_5_vl_private_invoke_smoke_blocked_identity_token_fetch_no_request`.

Mode: `qwen2_5_vl_private_invoke_smoke_execute_result_blocked_before_request`.

Run ID: `qwen25-private-invoke-smoke-20260627T104058`.

This packet records the controlled private invoke smoke attempt after the no-invocation smoke plan. The smoke stopped before a Cloud Run request because the active local user account could not mint an audience-bound identity token with the guarded command. No identity token value was printed or stored, no auth header was created, no Cloud Run request was sent, no GPU instance was invoked by this smoke, no model import ran, no model load ran, no vLLM engine initialized, no forward pass ran, no inference ran, no worker was dispatched, no Supabase mutation occurred, no SQL executed, no generated asset was created, no public artifact was created, no signed URL was created, no credit mutation occurred, and no beta or production readiness was claimed.

## Source Evidence

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-smoke-plan.md`
- `docs/qwen2-5-vl-7b-private-invoke-auth-reverify-result.md`
- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts`
- `server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute.ts`
- `server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-execute-result.ts`

## Fresh Preflight

- preflight run: `qwen25-private-invoke-auth-20260627T101708`
- status: passed
- active project: `reeditpro`
- Cloud Run service describe: passed
- service URL stored in repo evidence: false
- service audience value stored in repo evidence: false
- service max scale observed: `3`
- template max scale observed: `1`
- minimum scale annotation present: false

## Smoke Attempt

- method planned: `POST`
- path planned: `/`
- body source: approved-snapshot local queue fixture
- request body bytes: `1714`
- max body bytes: `65536`
- retry attempted: false
- cost guard reviewed before invoke: true
- identity token fetched: false
- auth header created: false
- Cloud Run request sent: false

The guarded runner resolved the service target in memory, reviewed the cost posture, and then attempted the identity-token step. The token step returned a local auth blocker: the active user account cannot mint an audience-bound identity token with the requested command. Because token fetch failed, the smoke did not call the Cloud Run service.

## Blocker

Blocker: `identity_token_fetch_blocked`.

The next implementation must define an approved backend-safe token path for private invocation. Acceptable future directions are service-account impersonation or another approved non-key credential path, but only if the repo records the required permission proof and preserves no service-account key files, no printed token values, no committed auth headers, no public unauthenticated invocation, no broad IAM mutation, no inference, no generated assets, and no beta or production unlock.

## Runtime Flags

- `privateInvokeSmokeRunnerDefined=true`
- `requiresExplicitExecutionFlag=true`
- `requiresConfirmationEnv=true`
- `authReverifyPassed=true`
- `costGuardReviewedBeforeInvoke=true`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_52-FIX-PRIVATE-INVOKE-SMOKE: fix controlled private invoke smoke blocker, no inference`
