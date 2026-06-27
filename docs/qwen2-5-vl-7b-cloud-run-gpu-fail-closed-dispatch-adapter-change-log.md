# Qwen2.5-VL 7B Cloud Run GPU Fail-Closed Dispatch Adapter Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation",
  "adapterContract": {
    "adapterId": "qwen2_5_vl_cloud_run_gpu_fail_closed_dispatch_adapter",
    "workerType": "qwen2_5_vl_cloud_run_gpu_worker",
    "jobType": "media_analysis",
    "runtimeSchemaVersion": "qwen2_5_vl_cloud_run_gpu_runtime_request_v1",
    "acceptsValidatedLocalQueueContract": true,
    "submitsDispatch": false,
    "invokesCloudRun": false,
    "enablesInference": false
  },
  "adapterOutcomes": [
    "blocked_invalid_queue_contract",
    "blocked_fail_closed_cloud_run_invocation_disabled"
  ],
  "acceptedInputs": [
    "validated_runWorkerJobSchema_queue_envelope",
    "approved_snapshot_runtime_payload",
    "credit_reservation_reference",
    "queue_lease_reference",
    "idempotency_key",
    "private_source_of_truth_refs"
  ],
  "refusedInputs": [
    "invalid_queue_contract",
    "raw_prompt_payload",
    "signed_url_source_of_truth",
    "public_url_source_of_truth",
    "enabled_runtime_gate",
    "model_policy_mismatch",
    "missing_approved_snapshot",
    "missing_credit_reservation",
    "missing_queue_lease"
  ],
  "requiredBeforeEnablingCloudRunInvocation": [
    "backend_dispatch_route_for_qwen_worker",
    "service_role_transactional_job_claim_and_lease",
    "backend_idempotency_conflict_enforcement",
    "private_cloud_run_service_to_service_invocation_auth",
    "approved_snapshot_hash_verification",
    "credit_reservation_verification",
    "failure_release_or_refund_policy",
    "observability_for_dispatch_attempts_and_results"
  ],
  "runtimeFlags": {
    "adapterImplemented": true,
    "adapterInvokedLocally": true,
    "validQueueFixtureRefusedFailClosed": true,
    "invalidQueueFixtureRefusedBeforeRuntime": true,
    "dispatchSubmitted": false,
    "cloudRunInvocationAttempted": false,
    "serviceRuntimeRequestSent": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_35-CLOUD-RUN-GPU-PRIVATE-INVOKE-PLAN: plan private Cloud Run invocation transport for Qwen dispatch adapter, no invocation"
}
```
