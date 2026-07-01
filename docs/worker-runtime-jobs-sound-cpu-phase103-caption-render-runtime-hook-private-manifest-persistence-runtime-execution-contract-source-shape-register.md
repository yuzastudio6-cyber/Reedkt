# WORKER_RUNTIME_JOBS SOUND CPU Phase 103 Runtime Execution Contract Source Shape Register

```json worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-shape-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-shape-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase103_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_plan_completed_with_warnings_ready_for_contract_source_gate_no_execution",
  "plannedShape": {
    "inputContract": "SoundCpuPrivateManifestPersistenceInput",
    "resultContract": "SoundCpuPrivateManifestPersistenceResult",
    "requiredStatus": "blocked_by_owner_gate",
    "requiredDefaultBlockedReason": "supabase_owner_gate_required",
    "requiredFalseResultFields": [
      "acceptedForPersistenceToday",
      "acceptedForStorageObjectCreationToday",
      "acceptedForSignedUrlCreationToday",
      "acceptedForWorkerDispatchToday",
      "acceptedForMediaOpenToday",
      "acceptedForBetaUnlockToday",
      "acceptedForProductionUnlockToday"
    ],
    "requiredRejectedInputFields": [
      "rawPromptText",
      "rawMediaPaths",
      "signedUrls",
      "providerOutputBlobs",
      "serviceRolePayloads",
      "secretValues",
      "modelWeightLocations",
      "publicArtifactUrls"
    ],
    "idempotencyRequired": true,
    "approvedPlanSnapshotRequired": true
  },
  "sourceCreationToday": {
    "sourceCreated": false,
    "runtimeExecuted": false,
    "workerDispatched": false,
    "manifestPersisted": false
  }
}
```

The future source shape must preserve the existing blocked-result contract exactly.
