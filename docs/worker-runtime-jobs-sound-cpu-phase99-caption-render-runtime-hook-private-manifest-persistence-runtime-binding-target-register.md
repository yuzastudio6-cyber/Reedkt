# WORKER_RUNTIME_JOBS SOUND CPU Phase 99 Runtime Binding Target Register

```json worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase99_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_plan_completed_with_warnings_ready_for_runtime_binding_owner_review_no_execution",
  "bindingTarget": {
    "runtimeBoundary": "caption_render_runtime_hook_private_manifest_persistence_boundary",
    "sourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
    "futureHookPlacement": "after_private_manifest_contract_assembly_before_any_persistence_attempt",
    "requiredAdapter": "createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult",
    "requiredMutationAssertion": "assertSoundCpuPrivateManifestPersistenceMutationBlocked",
    "expectedStatus": "blocked_by_owner_gate",
    "runtimeBindingImplementationToday": false,
    "workerDispatchToday": false,
    "mediaOpenToday": false,
    "persistenceToday": false
  },
  "acceptedInputsForPlanningOnly": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "stepId",
    "idempotencyKey",
    "workerName",
    "jobType",
    "privateManifestId",
    "privateMediaAssetIds",
    "plannedPrivateArtifactIds",
    "privateStorageObjectRefs"
  ],
  "rejectedRuntimeInputSources": [
    "rawPromptText",
    "rawMediaPaths",
    "signedUrls",
    "providerOutputBlobs",
    "serviceRolePayloads",
    "secretValues",
    "modelWeightLocations",
    "publicArtifactUrls"
  ]
}
```

The planned binding target is a boundary map, not runtime wiring. A later owner-reviewed source gate must still add any actual hook code.
