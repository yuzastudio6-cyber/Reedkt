# WORKER_RUNTIME_JOBS SOUND CPU External Beta Launch Core Tool Blocker Scope After Real User Media Boundary

```json worker-runtime-jobs-sound-cpu-external-beta-launch-core-tool-blocker-scope-after-real-user-media-boundary
{
  "label": "worker-runtime-jobs-sound-cpu-external-beta-launch-core-tool-blocker-scope-after-real-user-media-boundary",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_real_user_media_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_next_blocker_closure",
  "selectedLaunchCoreTools": [
    "ffmpeg",
    "ffprobe",
    "opentimelineio",
    "hyperframe",
    "remotion",
    "libass",
    "sharp_libvips",
    "opencv"
  ],
  "scopeForNextPrompt": {
    "closeForPlanningOnly": true,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "dockerGcpAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false
  },
  "deferredAfterLaunchCore": [
    "model_weight_and_license_reviews",
    "deployment_security_cost_approvals",
    "external_beta_unlock_owner_review"
  ]
}
```

This narrows the next prompt to launch-core readiness only. It does not execute or install these tools.
