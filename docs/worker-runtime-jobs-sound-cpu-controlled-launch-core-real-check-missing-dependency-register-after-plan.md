# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Missing Dependency Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-missing-dependency-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-missing-dependency-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "sourcePr": 1429,
  "sourceMergeCommit": "04a1c39fc645c4711fab1f888f22efaeb8279651",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "requiredMissingDependencies": [
    {
      "toolId": "pyav",
      "packageOrModule": "av",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "pyscenedetect",
      "packageOrModule": "scenedetect",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "opencv",
      "packageOrModule": "cv2",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "duckdb",
      "packageOrModule": "duckdb",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "polars",
      "packageOrModule": "polars",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "opentimelineio",
      "packageOrModule": "opentimelineio",
      "checkKind": "python_import",
      "nextAction": "plan Python dependency installation and rerun bounded import proof"
    },
    {
      "toolId": "sharp",
      "packageOrModule": "sharp/package.json",
      "checkKind": "node_package_metadata",
      "nextAction": "plan Node dependency availability and metadata proof"
    },
    {
      "toolId": "remotion",
      "packageOrModule": "remotion/package.json",
      "checkKind": "node_package_metadata",
      "nextAction": "plan Node dependency availability and metadata proof"
    }
  ],
  "optionalMissingOrWarningDependencies": [
    {
      "toolId": "libass",
      "packageOrModule": "ffmpeg filter list",
      "status": "warning",
      "nextAction": "manual review of subtitle/libass readiness remains required"
    },
    {
      "toolId": "openimageio",
      "packageOrModule": "OpenImageIO",
      "status": "not_installed",
      "nextAction": "keep optional until source/package review"
    },
    {
      "toolId": "opencolorio",
      "packageOrModule": "PyOpenColorIO",
      "status": "not_installed",
      "nextAction": "keep optional until color pipeline source/package review"
    },
    {
      "toolId": "hyperframe",
      "packageOrModule": "hyperframe/package.json",
      "status": "not_installed",
      "nextAction": "keep optional until preview/timeline package review"
    }
  ],
  "policyBlockers": [
    {
      "toolId": "ffmpeg_lgpl_policy",
      "status": "pending_manual_review",
      "nextAction": "commercial LGPL-safe FFmpeg packaging review"
    },
    {
      "toolId": "revideo",
      "status": "evaluation_only",
      "nextAction": "do not include in production readiness"
    }
  ],
  "dependencyRegisterConclusion": {
    "requiredMissingCount": 8,
    "optionalMissingOrWarningCount": 4,
    "policyBlockerCount": 2,
    "installPlanRequired": true,
    "installExecutionApprovedToday": false,
    "runtimeBetaAllowed": false,
    "productionAllowed": false
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

The next gate should plan dependency installation/remediation. It must not install, run, or unlock anything until that plan is reviewed by the same evidence path.
