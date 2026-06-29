# WORKER_RUNTIME_JOBS SOUND CPU Phase 37J Caption Render Runtime Hook Static Integration Source Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof_no_execution",
  "acceptedForControlledStaticImportProofOnly": {
    "integrationTarget": "server/workers/sound-cpu/index.ts",
    "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
    "expectedImportedSymbolCount": 7,
    "proofMayImportIndex": true,
    "proofMayTypecheckOnly": true,
    "proofMayCallHookFactory": false,
    "proofMayCallBlockedAssertion": false,
    "proofMayExecuteWorkers": false,
    "proofMayProcessMedia": false
  },
  "acceptedExportedSymbols": [
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON",
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME",
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS",
    "assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked",
    "createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult",
    "SoundCpuOcrCaptionRenderSafeZoneHookInput",
    "SoundCpuOcrCaptionRenderSafeZoneHookResult"
  ],
  "rejectedForToday": [
    "controlled static import proof execution in this owner-review gate",
    "hook factory invocation",
    "blocked assertion invocation",
    "OCR runtime execution",
    "caption/render runtime execution",
    "worker execution",
    "route/tool execution",
    "provider/model call",
    "media processing",
    "artifact creation",
    "real-user media beta",
    "paid production"
  ],
  "requiredFalseDefaults": {
    "staticImportProofCreatedInThisGate": false,
    "staticImportProofRunInThisGate": false,
    "runtimeHookExecutionApprovedToday": false,
    "captionRenderRuntimeHookExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "renderExecutionApprovedToday": false,
    "artifactCreationApprovedToday": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  }
}
```

Acceptance is limited to a future import/typecheck proof. Runtime calls remain blocked.
