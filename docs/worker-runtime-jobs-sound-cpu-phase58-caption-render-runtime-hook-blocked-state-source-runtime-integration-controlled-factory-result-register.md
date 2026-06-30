# WORKER_RUNTIME_JOBS SOUND CPU Phase 58 Caption Render Runtime Hook Blocked-State Source Runtime Integration Controlled Factory Result Register

```json worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-result-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase58-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-factory-result-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase58_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_factory_validation_passed_with_warnings_ready_for_controlled_hook_execution_plan_no_media_no_artifacts",
  "syntheticInput": {
    "approvedPlanSnapshotId": "phase58-synthetic-approved-plan",
    "runtimeIntegrationPlanId": "phase58-synthetic-runtime-integration-plan",
    "blockedStateIntegrationPlanId": "phase58-synthetic-blocked-state-plan"
  },
  "observedResult": {
    "blockedStatus": "blocked_by_owner_gate",
    "runtimeIntegrationName": "ocrCaptionRenderSafeZoneRuntimeIntegration",
    "runtimeIntegrationSourceStatus": "runtime_integration_source_created_execution_blocked",
    "runtimeIntegrationSourceModificationStatus": "phase56_runtime_source_modified_execution_blocked",
    "blockedStateIntegrationName": "ocrCaptionRenderSafeZoneBlockedStateIntegration",
    "hookName": "ocrCaptionRenderSafeZonePlanningHook",
    "ownerGateRequired": "WORKER_RUNTIME_JOBS",
    "runtimeDisabledFlags": {
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
      "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
      "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0"
    },
    "runtimeSourceModifiedWithFailClosedGuards": true,
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false,
    "supabaseSqlApproved": false,
    "routeToolProviderApproved": false,
    "realUserMediaBetaApproved": false,
    "paidProductionApproved": false,
    "noArtifactCreated": true,
    "blockedStateIntegrationResultStatus": "blocked_by_owner_gate",
    "blockedStateNoArtifactCreated": true
  },
  "resultInspectionOnly": true
}
```

The controlled factory result remained fail-closed across the runtime integration and nested blocked-state integration.
