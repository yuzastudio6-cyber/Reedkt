# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Config Contract Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-invoke-config-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_invoke_config_contract_defined_no_invocation",
  "configContract": {
    "project": "reeditpro",
    "region": "us-central1",
    "service": "reeditpro-qwen2-5-vl-l4-worker",
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "authMode": "google_signed_identity_token_backend_only",
    "timeoutMs": 300000,
    "maxBodyBytes": 65536,
    "invocationEnabledNow": false,
    "retriesEnabledNow": false,
    "serviceUrlStoredInRepo": false,
    "audienceResolvedNow": false
  },
  "allowedBackendConfigKeys": [
    "QWEN25_VL_CLOUD_RUN_PROJECT",
    "QWEN25_VL_CLOUD_RUN_REGION",
    "QWEN25_VL_CLOUD_RUN_SERVICE",
    "QWEN25_VL_CLOUD_RUN_AUDIENCE_SOURCE",
    "QWEN25_VL_CLOUD_RUN_TIMEOUT_MS",
    "QWEN25_VL_CLOUD_RUN_MAX_BODY_BYTES",
    "QWEN25_VL_CLOUD_RUN_INVOCATION_ENABLED"
  ],
  "blockedConfigBypasses": [
    "stored_concrete_service_url",
    "stored_identity_token",
    "stored_key_material",
    "frontend_runtime_config_exposure",
    "invocation_enabled_before_backend_runtime",
    "retry_enabled_before_idempotency_policy",
    "timeout_above_service_bound",
    "body_limit_above_runtime_contract"
  ],
  "runtimeFlags": {
    "privateInvokeConfigContractDefined": true,
    "configValidationImplemented": true,
    "validConfigCandidateAcceptedForFutureRuntime": true,
    "unsafeConfigCandidatesRejected": true,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_37-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG-SMOKE: run private invocation config contract smoke, no invocation"
}
```
