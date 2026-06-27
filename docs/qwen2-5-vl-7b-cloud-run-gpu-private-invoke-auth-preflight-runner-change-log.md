# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Auth Preflight Runner Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-invoke-auth-preflight-runner-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_runner_defined_no_invocation",
  "runner": {
    "cli": "server/cli/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts",
    "activationModule": "server/activation/qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight.ts",
    "defaultMode": "plan_only_no_gcloud",
    "executeMode": "read_only_gcloud_describe_only",
    "requiredConfirmationEnv": "REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT",
    "tokenOutput": "not_printed",
    "identityTokenFetchAllowed": false,
    "cloudRunInvocationAllowed": false
  },
  "target": {
    "project": "reeditpro",
    "region": "us-central1",
    "service": "reeditpro-qwen2-5-vl-l4-worker",
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com"
  },
  "readOnlyProbeIds": [
    "gcloud_version",
    "active_project",
    "active_account",
    "cloud_run_service_describe",
    "cloud_run_service_iam_policy",
    "runtime_service_account_describe",
    "project_invoker_policy_read"
  ],
  "runtimeFlags": {
    "authPreflightRunnerDefined": true,
    "defaultModeNonMutating": true,
    "requiresExplicitExecutionFlag": true,
    "requiresConfirmationEnv": true,
    "tokenOutputPrinted": false,
    "serviceAccountKeyCreated": false,
    "serviceUrlResolvedNowByDefault": false,
    "identityTokenFetched": false,
    "cloudRunInvocationAttempted": false,
    "serviceRuntimeRequestSent": false,
    "iamBindingCreated": false,
    "dispatchSubmitted": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "vllmEngineInitialized": false,
    "forwardPassRun": false,
    "inferenceRun": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "generatedAssetsCreated": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_39-GCLOUD-REAUTH-VERIFY: refresh gcloud auth and run guarded read-only auth preflight, no token/no invocation"
}
```
