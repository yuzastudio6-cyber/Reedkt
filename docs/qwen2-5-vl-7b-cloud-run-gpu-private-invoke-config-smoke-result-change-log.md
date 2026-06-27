# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Config Smoke Result Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-smoke-result-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_smoke_passed_no_invocation",
  "smoke": {
    "mode": "private_invoke_config_contract_smoke",
    "command": "npm run smoke:qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config",
    "localOnly": true,
    "configContractImported": true,
    "docsChecked": true,
    "packageScriptChecked": true,
    "cloudRunUsed": false,
    "gcpTouched": false,
    "identityTokenFetched": false,
    "cloudRunInvocationAttempted": false,
    "inferenceRun": false
  },
  "validatedConfig": {
    "project": "reeditpro",
    "region": "us-central1",
    "service": "reeditpro-qwen2-5-vl-l4-worker",
    "authMode": "google_signed_identity_token_backend_only",
    "timeoutMs": 300000,
    "maxBodyBytes": 65536,
    "allowedBackendConfigKeyCount": 7,
    "serviceUrlStoredInRepo": false,
    "serviceUrlResolvedNow": false,
    "audienceResolvedNow": false,
    "invocationEnabledNow": false,
    "retriesEnabledNow": false
  },
  "fixtureResults": {
    "validCandidateAcceptedForFutureRuntime": true,
    "invocationEnabledCandidateRejected": true,
    "storedServiceUrlCandidateRejected": true,
    "audienceNotBackendCandidateRejected": true,
    "retriesEnabledCandidateRejected": true,
    "bodyMismatchCandidateRejected": true,
    "forbiddenValuesRejected": true
  },
  "runtimeFlags": {
    "privateInvokeConfigSmokePassed": true,
    "configContractImported": true,
    "configDocsChecked": true,
    "packageScriptChecked": true,
    "validCandidateAcceptedForFutureRuntime": true,
    "unsafeConfigCandidatesRejected": true,
    "forbiddenValuesRejected": true,
    "configValuesReadNow": false,
    "serviceUrlStoredInRepo": false,
    "serviceUrlResolvedNow": false,
    "audienceResolvedNow": false,
    "identityTokenFetched": false,
    "cloudRunInvocationAttempted": false,
    "serviceRuntimeRequestSent": false,
    "dispatchSubmitted": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "vllmEngineInitialized": false,
    "promptProcessed": false,
    "forwardPassRun": false,
    "inferenceRun": false,
    "providerCallsMade": false,
    "workersDispatched": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_38-CLOUD-RUN-GPU-PRIVATE-INVOKE-AUTH-PREFLIGHT: verify private Cloud Run IAM and service account preconditions, no token/no invocation"
}
```
