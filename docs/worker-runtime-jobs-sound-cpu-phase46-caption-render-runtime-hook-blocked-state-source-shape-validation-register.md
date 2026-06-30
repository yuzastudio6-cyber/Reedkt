# WORKER_RUNTIME_JOBS SOUND CPU Phase 46 Caption Render Runtime Hook Blocked-State Source Shape Validation Register

```json worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-shape-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-shape-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts",
  "validatedSources": {
    "hook": {
      "path": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
      "statusConstant": "source_created_execution_blocked",
      "hookName": "ocrCaptionRenderSafeZonePlanningHook",
      "factory": "createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult",
      "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked",
      "requiresApprovedPlanSnapshotId": true,
      "usesRuntimeDisabledFlagsGuard": true,
      "returnsBlockedByOwnerGate": true,
      "returnsNoArtifactCreated": true
    },
    "blockedStateIntegration": {
      "path": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
      "statusConstant": "blocked_state_source_created_execution_blocked",
      "integrationName": "ocrCaptionRenderSafeZoneBlockedStateIntegration",
      "factory": "createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult",
      "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked",
      "requiresApprovedPlanSnapshotId": true,
      "requiresIntegrationPlanId": true,
      "usesRuntimeDisabledFlagsGuard": true,
      "returnsBlockedByOwnerGate": true,
      "returnsOwnerGateRequired": true,
      "returnsNoArtifactCreated": true
    },
    "runtimeIntegration": {
      "path": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
      "statusConstant": "runtime_integration_source_created_execution_blocked",
      "integrationName": "ocrCaptionRenderSafeZoneRuntimeIntegration",
      "factory": "createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult",
      "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked",
      "requiresApprovedPlanSnapshotId": true,
      "requiresRuntimeIntegrationPlanId": true,
      "requiresBlockedStateIntegrationPlanId": true,
      "usesRuntimeDisabledFlagsGuard": true,
      "returnsBlockedByOwnerGate": true,
      "returnsOwnerGateRequired": true,
      "returnsNoArtifactCreated": true
    },
    "indexExports": {
      "path": "server/workers/sound-cpu/index.ts",
      "exportsHook": true,
      "exportsBlockedStateIntegration": true,
      "exportsRuntimeIntegration": true
    }
  },
  "requiredFalseResultFields": {
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false,
    "supabaseSqlApproved": false,
    "routeToolProviderApproved": false,
    "realUserMediaBetaApproved": false,
    "paidProductionApproved": false
  }
}
```

The current source exposes static fail-closed planning surfaces only. The result shapes keep runtime, media, artifact, Supabase, beta, and production claims false.
