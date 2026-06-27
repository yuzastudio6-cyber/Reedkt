# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Local Queue Contract Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_local_queue_contract_defined_no_dispatch_no_inference",
  "queueEnvelope": {
    "schema": "runWorkerJobSchema",
    "workerType": "qwen2_5_vl_cloud_run_gpu_worker",
    "jobType": "media_analysis",
    "dryRun": true,
    "approvedSnapshotRequired": true,
    "creditReservationRequired": true,
    "queueLeaseRequired": true,
    "idempotencyKeyRequired": true
  },
  "runtimePayload": {
    "schemaVersion": "qwen2_5_vl_cloud_run_gpu_runtime_request_v1",
    "sourceOfTruthRequired": [
      "supabaseRowRefs",
      "privateManifestRefs",
      "checksumRefs",
      "approvedPlanSnapshotRefs"
    ],
    "allowedTaskUseCases": [
      "visual_understanding",
      "broll_candidate_review",
      "frame_asset_qa",
      "caption_visual_consistency_qa"
    ]
  },
  "blockedFixtures": [
    "missing_approved_snapshot",
    "missing_credit_reservation",
    "missing_queue_lease",
    "raw_prompt_payload",
    "signed_url_source_of_truth",
    "enabled_runtime_gate",
    "model_policy_mismatch",
    "worker_type_mismatch"
  ],
  "runtimeFlags": {
    "localQueueContractDefined": true,
    "validQueueFixtureMatchesRunWorkerJobSchema": true,
    "validQueueFixtureAcceptedForFutureDispatch": true,
    "dispatchAllowedNow": false,
    "cloudRunInvocationAllowedNow": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_33-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-DISPATCH-READINESS: audit Worker Runtime dispatch readiness for Qwen approved-snapshot jobs, no dispatch"
}
```
