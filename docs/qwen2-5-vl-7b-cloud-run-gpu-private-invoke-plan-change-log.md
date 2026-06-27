# Qwen2.5-VL 7B Cloud Run GPU Private Invocation Plan Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-private-invoke-plan-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_private_invoke_transport_planned_no_invocation",
  "targetService": {
    "project": "reeditpro",
    "region": "us-central1",
    "service": "reeditpro-qwen2-5-vl-l4-worker",
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "gpu": "nvidia-l4",
    "cpu": 8,
    "memory": "32Gi",
    "minInstances": 0,
    "maxInstances": 1,
    "concurrency": 1,
    "timeoutSeconds": 900,
    "publicUnauthenticatedAccess": false,
    "ingress": "internal-and-cloud-load-balancing",
    "serviceUrlStoredInRepo": false
  },
  "futureAuthRequirements": [
    "backend_controlled_runtime",
    "minimal_cloud_run_invoker_permission",
    "runtime_google_signed_identity_token",
    "audience_matches_receiving_service_or_custom_audience",
    "serverless_auth_header",
    "no_checked_in_keys",
    "no_frontend_tokens",
    "no_unauthenticated_access"
  ],
  "futureRequestShape": {
    "method": "POST",
    "path": "root_service_handler",
    "contentType": "application/json",
    "maxBodyBytes": 65536,
    "schemaVersion": "qwen2_5_vl_cloud_run_gpu_runtime_request_v1",
    "auth": "backend_acquired_identity_token",
    "retriesEnabledNow": false
  },
  "blockedBypasses": [
    "direct_frontend_invocation",
    "unauthenticated_invocation",
    "public_ingress_relaxation",
    "stored_service_account_keys",
    "checked_in_tokens_or_credentials",
    "signed_url_source_of_truth_payloads",
    "public_url_media_inputs",
    "raw_prompt_payloads",
    "generic_mock_dispatch_completion_substitution",
    "retry_without_idempotency",
    "credit_spend_without_verified_response_handling"
  ],
  "runtimeFlags": {
    "privateInvokePlanDefined": true,
    "targetServiceRecorded": true,
    "idTokenAudienceRequirementRecorded": true,
    "ingressRequirementRecorded": true,
    "iamInvokerRequirementRecorded": true,
    "serviceUrlStoredInRepo": false,
    "gcloudCommandRun": false,
    "iamBindingCreated": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_36-CLOUD-RUN-GPU-PRIVATE-INVOKE-CONFIG: define backend-only private invocation config contract, no invocation"
}
```
