# Qwen2.5-VL 7B Private Invoke Auth Reverify Result

## Status

Mode: `qwen2_5_vl_private_invoke_auth_reverify_result_passed_no_invocation`.

Run ID: `qwen25-private-invoke-auth-20260627T095446`.

The guarded read-only auth reverify was rerun after the Qwen private-invoke transport preview was added. The read-only `gcloud` version, active project, active account-domain, Cloud Run service describe, Cloud Run service IAM policy read, runtime service account describe, and project invoker policy read probes passed. No identity token was fetched, no service URL was stored, no auth header was created, no Cloud Run request was sent, no inference ran, no worker was dispatched, no Supabase mutation occurred, no SQL executed, no generated asset was created, and no beta or production readiness was claimed.

## Target

- project: `reeditpro`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- runtime identity: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Passed Read-Only Probes

- `gcloud_version`
- `active_project`
- `active_account`
- `cloud_run_service_describe`
- `cloud_run_service_iam_policy`
- `runtime_service_account_describe`
- `project_invoker_policy_read`

The active project was verified as `reeditpro`. An active account was present under the `reeditpro.com` domain. The full active account value is not stored in this packet.

## Blocked Read-Only Probes

None.

The runner did not prompt for login, did not call `gcloud auth login`, did not fetch tokens, and did not invoke Cloud Run.

## Observed Cloud Run Cost Posture

- target region: `us-central1`
- GPU limit: `1`
- GPU type: `nvidia_l4`
- CPU limit: `8`
- memory limit: `32Gi`
- container concurrency: `1`
- timeout seconds: `900`
- minimum scale annotation present: false
- template max scale: `1`
- service max scale annotation: `3`
- ingress: `internal-and-cloud-load-balancing`
- service URL stored: false
- cost guard review required before invoke: true

The service is still aligned with the run-on-use GPU posture because no minimum scale annotation was observed and no invocation was attempted. The service-level max scale annotation of `3` requires a cost guard review before any controlled invoke smoke, because earlier planning selected an initial private invoke cap of one active instance.

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

- private invocation auth verified: true
- Cloud Run service describe verified: true
- Cloud Run IAM policy verified: true
- runtime service account verified: true
- project invoker policy verified: true
- ready for private invocation smoke: false
- beta/production ready claimed: false

## Remaining Blocker

The next action is no longer a manual `gcloud` reauth step. The remaining blocker is a controlled private invoke smoke plan that must explicitly decide whether and how to fetch an identity token, resolve the service audience, invoke only the approved private Cloud Run route, and keep inference disabled or bounded. This packet does not include token material and does not authorize an invocation.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_52-PRIVATE-INVOKE-SMOKE-EXECUTE: run controlled private invoke contract smoke, no inference`
