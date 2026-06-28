# WORKER_RUNTIME_JOBS SOUND CPU External Beta Blocker Live Readiness After Real User Media Boundary

```json worker-runtime-jobs-sound-cpu-external-beta-blocker-live-readiness-after-real-user-media-boundary
{
  "label": "worker-runtime-jobs-sound-cpu-external-beta-blocker-live-readiness-after-real-user-media-boundary",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_real_user_media_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_next_blocker_closure",
  "prodReadinessSummary": {
    "overallStatus": "blocked",
    "workers": 6,
    "tools": 49,
    "images": 6,
    "modelWeightBlockers": 8,
    "hardBlockers": 101,
    "warnings": 26,
    "toolStatuses": {
      "missing": 10,
      "notInstalled": 17,
      "futureOnly": 7,
      "evaluationOnly": 3,
      "needsLicenseReview": 2,
      "needsModelWeightReview": 10
    },
    "topLaunchCoreBlockers": [
      "FFmpeg",
      "ffprobe",
      "OpenTimelineIO",
      "Hyperframe",
      "Remotion",
      "libass",
      "Sharp + libvips",
      "OpenCV"
    ]
  },
  "prodBetaSummary": {
    "status": "internal_testing_ready",
    "internalDryRunAllowed": true,
    "externalBetaAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionAllowed": false
  },
  "crossChatOwnershipDiagnostics": {
    "status": "passed",
    "ownershipConflicts": 0,
    "runtimeClaimsClosed": true,
    "supabaseUpdateRequired": false
  },
  "liveConclusion": {
    "externalBetaStillBlocked": true,
    "firstSelectedBlocker": "launch_core_tool_readiness_missing",
    "safeToUnlockExternalBetaInThisPrompt": false
  }
}
```

Live readiness still blocks external beta. The launch-core tool stack is the first concrete blocker to isolate next.
