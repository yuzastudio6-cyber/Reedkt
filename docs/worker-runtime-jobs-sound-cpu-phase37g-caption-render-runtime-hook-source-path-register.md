# WORKER_RUNTIME_JOBS SOUND CPU Phase 37G Caption Render Runtime Hook Source Path Register

```json worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-path-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-path-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_plan_completed_with_warnings_ready_for_source_owner_review_no_execution",
  "plannedFutureFiles": [
    {
      "path": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
      "purpose": "Future fail-closed static hook for translating approved Phase 37E OCR/caption QA metadata into caption safe-zone constraints.",
      "createdInThisGate": false,
      "approvedForFutureSourceCreationPlanning": true,
      "approvedForRuntimeExecutionToday": false
    }
  ],
  "sourceContextOnly": [
    "server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts",
    "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts",
    "server/workers/captions/caption-safe-zone-policy.ts",
    "server/activation/ocr-caption-render-qa/ocr-caption-render-qa-caption-constraints.ts",
    "server/activation/ocr-caption-render-qa/approved-ocr-caption-render-qa-evidence.ts"
  ],
  "notPlannedInThisGate": [
    "server/workers/render/* source changes",
    "server/routes/* source changes",
    "Supabase migrations",
    "artifact writers",
    "Remotion runtime wiring",
    "worker dispatcher wiring"
  ]
}
```

The planned path is intentionally under the SOUND CPU runtime boundary because this lane is owned by `WORKER_RUNTIME_JOBS`. Caption/render and media owners still need later gates before execution.
