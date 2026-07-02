# WORKER_RUNTIME_JOBS SOUND CPU Phase 118 Product Tool Execution Gate Plan No Real User Media Scope Register

```json worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase118-product-tool-execution-gate-plan-no-real-user-media-scope-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase118_product_tool_execution_gate_plan_no_real_user_media_completed_with_warnings_ready_for_product_tool_execution_gate_owner_review",
  "plannedGateEnvelope": {
    "gatePlanOnly": true,
    "toolCount": 15,
    "workers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "images": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "requiredPlanningFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "attemptNumber",
      "staticOnlyRuntimeFlags"
    ],
    "inputPolicy": {
      "syntheticOrNoMediaOnly": true,
      "realUserMediaAllowed": false,
      "rawPromptAllowed": false,
      "mediaFilePathAllowed": false,
      "signedUrlInputAllowed": false,
      "storageObjectInputAllowed": false,
      "providerOutputBlobAllowed": false,
      "secretPayloadAllowed": false,
      "serviceRolePayloadAllowed": false,
      "modelWeightLocationAllowed": false,
      "artifactWriteTargetAllowed": false
    },
    "runtimePolicy": {
      "productToolCallExecutionAllowedToday": false,
      "controlledProductToolExecutionProofAllowedToday": false,
      "realExternalAgentExecutionAllowedToday": false,
      "workerDispatchAllowedToday": false,
      "routeExecutionAllowedToday": false,
      "manifestPersistenceAllowedToday": false,
      "mediaOpenAllowedToday": false,
      "artifactWriteAllowedToday": false
    }
  }
}
```

The gate envelope is strict enough for a later proof to know what to stop on before any product tool execution is attempted.
