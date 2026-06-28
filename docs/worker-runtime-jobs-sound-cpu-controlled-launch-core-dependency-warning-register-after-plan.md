# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Dependency Warning Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-warning-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-warning-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "sourcePr": 1435,
  "sourceMergeCommit": "70c37bbee038b46bb67785e16d489a506ec4b1df",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production",
  "remainingWarningsAndBlockers": [
    {
      "id": "libass_filter_inspection_warning",
      "status": "warning",
      "blocksRuntimeReadiness": true,
      "summary": "ffmpeg filter-list inspection did not match expected libass/subtitle readiness pattern"
    },
    {
      "id": "pyav_opencv_bundled_ffmpeg_dylib_overlap",
      "status": "warning",
      "blocksRuntimeReadiness": true,
      "summary": "PyAV and OpenCV wheels both reported AVFoundation receiver classes from bundled FFmpeg dylibs"
    },
    {
      "id": "ffmpeg_lgpl_safe_build_manual_review",
      "status": "pending_manual_review",
      "blocksRuntimeReadiness": true,
      "summary": "Local FFmpeg command exists, but commercial packaging remains unapproved"
    },
    {
      "id": "openimageio_opencolorio_deferred",
      "status": "optional_not_installed",
      "blocksRuntimeReadiness": false,
      "summary": "Optional OpenImageIO/OpenColorIO imports remain deferred"
    },
    {
      "id": "hyperframe_deferred",
      "status": "optional_not_installed",
      "blocksRuntimeReadiness": false,
      "summary": "Optional Hyperframe metadata remains deferred"
    },
    {
      "id": "revideo_evaluation_only",
      "status": "evaluation_only",
      "blocksRuntimeReadiness": true,
      "summary": "Revideo remains evaluation-only and excluded from production readiness"
    },
    {
      "id": "persistent_manifest_absent",
      "status": "follow_up_required",
      "blocksRuntimeReadiness": true,
      "summary": "Proof-only installs were not persisted to package or worker manifests"
    }
  ],
  "warningConclusion": {
    "requiredChecksPassed": true,
    "runtimeReadinessStillBlocked": true,
    "realUserMediaBetaStillBlocked": true,
    "paidProductionStillBlocked": true,
    "nextOwnerReviewRequired": true
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

The remaining warnings are material. They block runtime/media/beta readiness until owner review and persistent packaging gates close them.
