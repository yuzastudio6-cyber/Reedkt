# WORKER_RUNTIME_JOBS SOUND CPU Phase 37P Caption Render Runtime Hook Blocked-State Source Content Register

```json worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-content-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-content-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "exports": {
    "integrationNameConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME",
    "integrationStatusConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS",
    "blockedReasonConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON",
    "factory": "createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult",
    "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked",
    "inputType": "SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationInput",
    "resultType": "SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult"
  },
  "failClosedResultFields": {
    "blockedStatus": "blocked_by_owner_gate",
    "integrationSourceStatus": "blocked_state_source_created_execution_blocked",
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false,
    "supabaseSqlApproved": false,
    "noArtifactCreated": true
  }
}
```

The source content exposes static blocked-state metadata and a fail-closed assertion. It does not open any execution path.
