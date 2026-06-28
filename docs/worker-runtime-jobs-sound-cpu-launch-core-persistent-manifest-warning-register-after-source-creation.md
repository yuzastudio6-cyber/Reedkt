# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Persistent Manifest Warning Register After Source Creation

```json worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-warning-register-after-source-creation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_owner_review_after_source_creation_passed_with_warnings_ready_for_readiness_reconciliation_no_runtime_no_production",
  "warningsAcceptedForPlanningOnly": [
    {
      "id": "scenedetect_transitive_opencv_python",
      "summary": "scenedetect hydrated opencv-python transitively while the manifest explicitly pins opencv-python-headless",
      "blocksRuntimeReadiness": true,
      "blocksReadinessReconciliationPlanning": false
    },
    {
      "id": "pyav_opencv_native_library_overlap",
      "summary": "PyAV/OpenCV bundled native video library overlap remains owner-review gated before any runtime use",
      "blocksRuntimeReadiness": true,
      "blocksReadinessReconciliationPlanning": false
    },
    {
      "id": "ffmpeg_lgpl_safe_build_review",
      "summary": "FFmpeg and libass launch-core readiness remain under separate safe-build/license review",
      "blocksRuntimeReadiness": true,
      "blocksReadinessReconciliationPlanning": false
    },
    {
      "id": "optional_tool_deferment",
      "summary": "OpenImageIO, PyOpenColorIO, hyperframe, and Revideo remain deferred or evaluation-only",
      "blocksRuntimeReadiness": true,
      "blocksReadinessReconciliationPlanning": false
    }
  ],
  "warningConclusion": {
    "manifestSourceAcceptedDespiteWarnings": true,
    "runtimeStillBlocked": true,
    "realUserMediaBetaStillBlocked": true,
    "paidProductionStillBlocked": true
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

These warnings are acceptable for static reconciliation planning. They remain blockers for runtime or production claims.
