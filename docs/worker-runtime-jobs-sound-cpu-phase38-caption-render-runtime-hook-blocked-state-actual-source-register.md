# WORKER_RUNTIME_JOBS SOUND CPU Phase 38 Caption Render Runtime Hook Blocked-State Actual Source Register

```json worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-actual-source-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_actual_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts",
  "createdSource": {
    "path": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
    "status": "source_created_execution_blocked",
    "exportedFromIndexToday": false,
    "wiredToDispatchToday": false,
    "executedToday": false
  },
  "sourceSymbols": {
    "statusConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS",
    "nameConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME",
    "blockedReasonConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON",
    "inputType": "SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput",
    "resultType": "SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult",
    "blockedResultFactory": "createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult",
    "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked"
  },
  "preservedSources": {
    "blockedStateIntegrationSource": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
    "hookSource": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
    "runtimeGuardsSource": "server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts"
  }
}
```

The source exists for owner review only. It is not part of the public worker index or dispatch surface.
