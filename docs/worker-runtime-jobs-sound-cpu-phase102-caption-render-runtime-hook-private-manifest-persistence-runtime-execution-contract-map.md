# WORKER_RUNTIME_JOBS SOUND CPU Phase 102 Runtime Execution Contract Map

```json worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map
{
  "label": "worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map",
  "decision": "worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_plan_completed_with_warnings_ready_for_contract_owner_review_no_execution",
  "contractMap": {
    "futureExternalAgentEntry": "caption_render_runtime_hook_private_manifest_persistence",
    "currentCallableSource": "createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult",
    "inputContractType": "SoundCpuPrivateManifestPersistenceInput",
    "resultContractType": "SoundCpuPrivateManifestPersistenceResult",
    "requiredInputFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "stepId",
      "idempotencyKey",
      "workerName",
      "jobType",
      "privateManifestId",
      "manifestSchemaVersion",
      "privateMediaAssetIds",
      "plannedPrivateArtifactIds",
      "privateStorageObjectRefs",
      "createdByWorker",
      "createdAt"
    ],
    "optionalInputFields": [
      "auditEventId",
      "runtimeDefaults"
    ],
    "forbiddenInputFields": [
      "rawPromptText",
      "rawMediaPaths",
      "signedUrls",
      "providerOutputBlobs",
      "serviceRolePayloads",
      "secretValues",
      "modelWeightLocations",
      "publicArtifactUrls"
    ],
    "requiredResultStatus": "blocked_by_owner_gate",
    "requiredResultBooleansFalse": [
      "acceptedForPersistenceToday",
      "acceptedForStorageObjectCreationToday",
      "acceptedForSignedUrlCreationToday",
      "acceptedForWorkerDispatchToday",
      "acceptedForMediaOpenToday",
      "acceptedForBetaUnlockToday",
      "acceptedForProductionUnlockToday"
    ]
  },
  "executionScopeToday": {
    "externalAgentExecutionToday": false,
    "workerDispatchToday": false,
    "manifestPersistenceToday": false,
    "storageObjectCreationToday": false,
    "signedUrlCreationToday": false,
    "mediaOpenToday": false,
    "supabaseMutationToday": false,
    "sqlExecutionToday": false
  }
}
```

The future contract is constrained to structured IDs, deterministic worker/job metadata, and private opaque references. Raw prompts, signed URLs, local media paths, provider output blobs, service-role payloads, secrets, model-weight locations, and public artifact URLs are explicitly outside the contract.
