# WORKER_RUNTIME_JOBS SOUND CPU Phase 38 Caption Render Runtime Hook Blocked-State Source Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase38-caption-render-runtime-hook-blocked-state-source-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_source_owner_review_passed_with_warnings_ready_for_index_export_wiring_plan_no_media_no_artifacts",
  "acceptedSource": {
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase38_caption_render_runtime_hook_blocked_state_actual_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts",
    "runtimeIntegrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
    "statusConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS",
    "nameConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME",
    "blockedReasonConstant": "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON",
    "inputType": "SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput",
    "resultType": "SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult",
    "blockedResultFactory": "createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult",
    "blockedAssertion": "assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked",
    "failClosedResultAcceptedForFutureExport": true
  },
  "acceptedForNextGate": {
    "indexExportWiringPlanMayProceed": true,
    "indexExportWiringSourcePath": "server/workers/sound-cpu/index.ts",
    "exportOnlyFailClosedSymbols": true,
    "preserveNoDispatchWiring": true,
    "preserveNoHookExecution": true
  },
  "acceptedForToday": {
    "indexExportWiring": false,
    "dispatchWiring": false,
    "runtimeExecution": false,
    "mediaExecution": false,
    "artifactCreation": false,
    "supabaseSql": false,
    "realUserMediaBeta": false,
    "paidProduction": false
  }
}
```

The accepted source surface is static and fail-closed. The next gate may plan index export wiring only; it may not execute or route work.
