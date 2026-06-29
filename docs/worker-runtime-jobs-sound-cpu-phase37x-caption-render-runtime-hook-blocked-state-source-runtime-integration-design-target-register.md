# WORKER_RUNTIME_JOBS SOUND CPU Phase 37X Caption Render Runtime Hook Blocked-State Source Runtime Integration Design Target Register

```json worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-target-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37x-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-target-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37x_caption_render_runtime_hook_blocked_state_source_runtime_integration_design_plan_completed_with_warnings_ready_for_design_owner_review_no_media_no_artifacts",
  "integrationDesignTargets": {
    "blockedStateSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
    "staticExportTarget": "server/workers/sound-cpu/index.ts",
    "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
    "runtimeGuardSourcePath": "server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts",
    "jobContractSourcePath": "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts"
  },
  "designTargetsStatus": {
    "blockedStateSourceExists": true,
    "staticExportAlreadyPresent": true,
    "futureRuntimeDispatchIntegrationRequired": true,
    "futureOwnerReviewRequiredBeforeAnyRuntimeWiring": true,
    "sourceChangeRequiredInPhase37X": false
  },
  "forbiddenTargetsToday": [
    "worker dispatch or lease handlers",
    "route or tool handlers",
    "provider/model adapters",
    "media file readers",
    "artifact writers",
    "Supabase clients or SQL"
  ]
}
```

The design target is the already-created fail-closed blocked-state source and its static export. Runtime dispatch wiring remains a later owner-approved step.
