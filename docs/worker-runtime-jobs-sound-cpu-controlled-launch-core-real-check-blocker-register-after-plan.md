# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Real Check Blocker Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-blocker-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-blocker-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "sourcePr": 1429,
  "sourceMergeCommit": "04a1c39fc645c4711fab1f888f22efaeb8279651",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "blockers": [
    {
      "blockerId": "required_python_imports_missing",
      "status": "blocking",
      "affectedTools": [
        "pyav",
        "pyscenedetect",
        "opencv",
        "duckdb",
        "polars",
        "opentimelineio"
      ],
      "blocksRealUserMediaBeta": true,
      "blocksPaidProduction": true,
      "recommendedPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF"
    },
    {
      "blockerId": "required_node_package_metadata_missing",
      "status": "blocking",
      "affectedTools": [
        "sharp",
        "remotion"
      ],
      "blocksRealUserMediaBeta": true,
      "blocksPaidProduction": true,
      "recommendedPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF"
    },
    {
      "blockerId": "ffmpeg_lgpl_and_libass_manual_review",
      "status": "manual_review_required",
      "affectedTools": [
        "ffmpeg",
        "libass"
      ],
      "blocksRealUserMediaBeta": true,
      "blocksPaidProduction": true,
      "recommendedPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF"
    },
    {
      "blockerId": "optional_openimageio_opencolorio_hyperframe_missing",
      "status": "nonblocking_for_install_plan",
      "affectedTools": [
        "openimageio",
        "opencolorio",
        "hyperframe"
      ],
      "blocksRealUserMediaBeta": false,
      "blocksPaidProduction": true,
      "recommendedPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF"
    },
    {
      "blockerId": "gpu_model_tools_excluded",
      "status": "preserved",
      "affectedToolsCount": 13,
      "blocksRealUserMediaBeta": true,
      "blocksPaidProduction": true,
      "recommendedPrompt": "separate model-weight and GPU owner gates"
    }
  ],
  "blockerConclusion": {
    "controlledProofCompleted": true,
    "readinessPassed": false,
    "requiredMissingBlockers": 8,
    "nextSmallestSafeClosure": "launch_core_dependency_install_plan",
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
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

The controlled proof narrowed the blocker from broad launch-core uncertainty to concrete missing packages and manual reviews.
