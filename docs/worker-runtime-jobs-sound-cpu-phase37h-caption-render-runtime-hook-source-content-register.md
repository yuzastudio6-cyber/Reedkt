# WORKER_RUNTIME_JOBS SOUND CPU Phase 37H Caption Render Runtime Hook Source Content Register

```json worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-content-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-content-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37h_actual_caption_render_runtime_hook_source_created_with_warnings_ready_for_source_owner_review_no_execution",
  "sourceFile": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "exportedConstants": [
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME",
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS",
    "SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON"
  ],
  "exportedTypes": [
    "SoundCpuOcrCaptionRenderCollisionRisk",
    "SoundCpuOcrCaptionRenderConfidenceBand",
    "SoundCpuNormalizedBox",
    "SoundCpuCaptionCandidateZoneMetadata",
    "SoundCpuOcrRegionBoxMetadata",
    "SoundCpuOcrCaptionRenderSafeZoneHookInput",
    "SoundCpuOcrCaptionRenderSafeZoneConstraintPlan",
    "SoundCpuOcrCaptionRenderSafeZoneHookResult"
  ],
  "exportedFunctions": [
    "createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult",
    "assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked"
  ],
  "requiredRuntimeGuards": [
    "SOUND_CPU_RUNTIME_DISABLED_FLAGS",
    "SOUND_CPU_RUNTIME_OWNER_GATE",
    "assertSoundCpuRuntimeDisabledFlags"
  ],
  "resultShape": {
    "blockedStatus": "blocked_by_owner_gate",
    "ownerGateRequired": "WORKER_RUNTIME_JOBS",
    "noArtifactCreated": true,
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false
  }
}
```

The source content is a static metadata contract and blocked-result factory. It provides no OCR adapter, render adapter, worker dispatcher, route handler, artifact writer, or provider/model bridge.
