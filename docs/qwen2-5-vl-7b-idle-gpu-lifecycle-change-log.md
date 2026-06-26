# Qwen2.5-VL 7B Idle GPU Lifecycle Change Log

Decision: `qwen2_5_vl_7b_idle_gpu_lifecycle_plan_ready_for_cloud_run_gpu_scale_to_zero_review`

This change records the Qwen2.5-VL cost-control lifecycle: run only when queued/used, then stop or scale to zero when idle.

## Files Added

- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md`
- `docs/qwen2-5-vl-7b-idle-gpu-lifecycle-change-log.md`
- `docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md`
- `src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts`
- `scripts/validation/qwen2-5-vl-7b-idle-gpu-lifecycle-diagnostics.mjs`

## Files Updated

- `package.json`

## Result

```json qwen2-5-vl-7b-idle-gpu-lifecycle-change-log
{
  "phase": "QWEN2_5_VL_STACK_TOOL_10-IDLE-GPU-LIFECYCLE",
  "decision": "qwen2_5_vl_7b_idle_gpu_lifecycle_plan_ready_for_cloud_run_gpu_scale_to_zero_review",
  "sourceBranch": "codex/qwen2-5-vl-7b-l4-reservation-create-us-east4-a",
  "filesAdded": [
    "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md",
    "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-change-log.md",
    "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
    "src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts",
    "scripts/validation/qwen2-5-vl-7b-idle-gpu-lifecycle-diagnostics.mjs"
  ],
  "filesUpdated": [
    "package.json"
  ],
  "lifecycleDecision": {
    "selectedGpu": "nvidia_l4_google_cloud_g2",
    "alwaysOnGpuRejected": true,
    "longHeldIdleReservationRejected": true,
    "runOnlyWhenQueuedRequired": true,
    "stopWhenIdleRequired": true,
    "preferredPath": "cloud_run_gpu_scale_to_zero_review",
    "fallbackPath": "ephemeral_compute_engine_l4_worker_idle_teardown",
    "minActiveGpuWorkers": 0,
    "maxActiveGpuWorkers": 1,
    "proofIdleTimeoutSeconds": 600,
    "proofMaxRuntimeSeconds": 1800,
    "firstProofShape": "g2-standard-4",
    "betaCandidateShape": "g2-standard-8_or_cloud_run_gpu_equivalent"
  },
  "toolRole": {
    "qwenRole": "visual_understanding_planning_qa_tool",
    "generatedVideoRoute": false,
    "wanRemainsGeneratedBrollPrimary": true,
    "rawChatExecutionRejected": true,
    "approvedSnapshotRequired": true,
    "creditGateRequiredBeforeProductionUse": true
  },
  "runtimeFlags": {
    "gcpMutatingCommandsExecuted": false,
    "reservationCreated": false,
    "vmCreated": false,
    "cloudRunServiceCreated": false,
    "cloudRunJobCreated": false,
    "dockerBuildRun": false,
    "artifactRegistryImageCreated": false,
    "modelImportRun": false,
    "modelInferenceRun": false,
    "apiServerStarted": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_11-CLOUD-RUN-GPU-SCALE-TO-ZERO-REVIEW: evaluate Qwen Cloud Run GPU scale-to-zero fit, no deploy/no inference"
}
```
