# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Contract Smoke Result Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_contract_smoke_passed_no_inference",
  "smoke": {
    "mode": "local_handler_contract_smoke",
    "pythonBytecodeDisabled": true,
    "localhostOnly": true,
    "cloudRunUsed": false,
    "gcpTouched": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "inferenceRun": false
  },
  "fixtures": {
    "healthEndpoint": {
      "method": "GET",
      "path": "/healthz",
      "expectedStatus": 200
    },
    "contractEndpoint": {
      "method": "GET",
      "path": "/contract",
      "expectedStatus": 200,
      "schemaVersion": "qwen2_5_vl_cloud_run_gpu_runtime_request_v1"
    },
    "invalidJson": {
      "method": "POST",
      "expectedStatus": 400,
      "expectedReason": "invalid_json"
    },
    "oversizedRequest": {
      "method": "POST",
      "expectedStatus": 413,
      "expectedReason": "request_too_large"
    },
    "missingFields": {
      "method": "POST",
      "expectedStatus": 403,
      "expectedReason": "qwen_runtime_contract_rejected"
    },
    "rawPromptField": {
      "method": "POST",
      "expectedStatus": 403,
      "expectedReason": "qwen_runtime_contract_rejected",
      "expectedContractReasonPrefix": "raw_prompt_field_blocked"
    },
    "validContract": {
      "method": "POST",
      "expectedStatus": 403,
      "expectedReason": "qwen_inference_disabled_after_contract_check",
      "contractSatisfiedForFutureRuntime": true,
      "runtimeContractExecutesNow": false
    }
  },
  "runtimeFlags": {
    "localHandlerStarted": true,
    "localHandlerStopped": true,
    "contractEndpointChecked": true,
    "healthEndpointChecked": true,
    "invalidJsonRejected": true,
    "oversizedRequestRejected": true,
    "missingFieldsRejected": true,
    "rawPromptRejected": true,
    "validContractAcceptedForFutureRuntime": true,
    "validContractStillExecutes": false,
    "cloudRunTouched": false,
    "gcpMutationCreated": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_32-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-LOCAL-QUEUE-CONTRACT: define local queue payload handoff fixtures for Qwen approved-snapshot jobs, no inference"
}
```
