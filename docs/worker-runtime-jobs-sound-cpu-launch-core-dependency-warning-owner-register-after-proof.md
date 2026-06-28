# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Dependency Warning Owner Register

```json worker-runtime-jobs-sound-cpu-launch-core-dependency-warning-owner-register-after-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_proof_owner_review_after_proof_passed_with_warnings_ready_for_persistent_manifest_plan_no_runtime_no_production",
  "sourceProofPr": 1440,
  "sourceProofMergeCommit": "8205ef04f3eafe7aaf118b1673b99fb01d30cefb",
  "warningsPreserved": [
    {
      "id": "pyav_opencv_bundled_ffmpeg_dylib_overlap",
      "status": "warning_preserved",
      "ownerAction": "track before runtime/media readiness",
      "blocksRuntimeReadiness": true
    },
    {
      "id": "libass_filter_inspection_warning",
      "status": "warning_preserved",
      "ownerAction": "keep in FFmpeg policy review lane",
      "blocksProductionReadiness": true
    },
    {
      "id": "ffmpeg_lgpl_safe_build_manual_review",
      "status": "pending_manual_review",
      "ownerAction": "manual policy review still required",
      "blocksProductionReadiness": true
    },
    {
      "id": "optional_openimageio_pyopencolorio_hyperframe_deferred",
      "status": "optional_not_installed",
      "ownerAction": "defer outside required launch-core closure",
      "blocksRequiredLaunchCoreProof": false
    },
    {
      "id": "revideo_evaluation_only",
      "status": "evaluation_only",
      "ownerAction": "do not promote to production execution",
      "blocksProductionReadiness": true
    },
    {
      "id": "persistent_manifest_absent",
      "status": "follow_up_required",
      "ownerAction": "plan persistent Python and Node manifest placement",
      "blocksRuntimeReadiness": true
    }
  ],
  "warningConclusion": {
    "requiredChecksAccepted": true,
    "runtimeReadinessStillBlocked": true,
    "realUserMediaBetaStillBlocked": true,
    "productionStillBlocked": true,
    "nextPlanRequired": "persistent_manifest_plan"
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
