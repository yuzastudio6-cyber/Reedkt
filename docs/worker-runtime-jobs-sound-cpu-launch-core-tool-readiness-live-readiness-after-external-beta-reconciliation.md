# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Tool Readiness Live Readiness After External Beta Reconciliation

```json worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-live-readiness-after-external-beta-reconciliation
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-live-readiness-after-external-beta-reconciliation",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_tool_readiness_blocker_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_model_license_blocker_reconciliation_no_external_beta",
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
    "launchCoreBlockerWasFirstSelectedBlocker": true,
    "launchCoreClosedForPlanningOnly": true,
    "toolReadinessStillRequiresFutureProof": true,
    "externalBetaStillBlocked": true,
    "safeToUnlockExternalBetaInThisPrompt": false
  }
}
```

The live readiness summaries still block external beta. This packet only records a planning closure for the launch-core blocker handoff.
