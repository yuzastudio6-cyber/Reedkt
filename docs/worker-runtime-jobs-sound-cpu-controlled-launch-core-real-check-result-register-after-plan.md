# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Real Check Result Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-result-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-result-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "sourcePr": 1429,
  "sourceMergeCommit": "04a1c39fc645c4711fab1f888f22efaeb8279651",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "checkResults": [
    {
      "toolId": "ffmpeg",
      "checkKind": "command_version",
      "checkName": "ffmpeg_version",
      "status": "passed",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "ffmpeg version 8.1.1 command check passed; commercial LGPL-safe build review remains separate"
    },
    {
      "toolId": "ffprobe",
      "checkKind": "command_version",
      "checkName": "ffprobe_version",
      "status": "passed",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "ffprobe version 8.1.1 command check passed"
    },
    {
      "toolId": "libass",
      "checkKind": "command_version",
      "checkName": "ffmpeg_libass_filter_inspection",
      "status": "warning",
      "optional": true,
      "manualReviewRequired": true,
      "sanitizedEvidence": "ffmpeg filter-list inspection ran but did not match the expected libass/subtitle readiness pattern"
    },
    {
      "toolId": "pyav",
      "checkKind": "python_import",
      "checkName": "python_import_av",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import av failed"
    },
    {
      "toolId": "pyscenedetect",
      "checkKind": "python_import",
      "checkName": "python_import_scenedetect",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import scenedetect failed"
    },
    {
      "toolId": "opencv",
      "checkKind": "python_import",
      "checkName": "python_import_cv2",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import cv2 failed"
    },
    {
      "toolId": "duckdb",
      "checkKind": "python_import",
      "checkName": "python_import_duckdb",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import duckdb failed"
    },
    {
      "toolId": "polars",
      "checkKind": "python_import",
      "checkName": "python_import_polars",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import polars failed"
    },
    {
      "toolId": "opentimelineio",
      "checkKind": "python_import",
      "checkName": "python_import_opentimelineio",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Python import opentimelineio failed"
    },
    {
      "toolId": "openimageio",
      "checkKind": "python_import",
      "checkName": "python_import_openimageio",
      "status": "not_installed",
      "optional": true,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Optional Python import OpenImageIO failed"
    },
    {
      "toolId": "opencolorio",
      "checkKind": "python_import",
      "checkName": "python_import_pyopencolorio",
      "status": "not_installed",
      "optional": true,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Optional Python import PyOpenColorIO failed"
    },
    {
      "toolId": "sharp",
      "checkKind": "node_package_metadata",
      "checkName": "node_package_metadata_sharp",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "sharp/package.json metadata was not resolvable"
    },
    {
      "toolId": "remotion",
      "checkKind": "node_package_metadata",
      "checkName": "node_package_metadata_remotion",
      "status": "missing",
      "optional": false,
      "manualReviewRequired": false,
      "sanitizedEvidence": "remotion/package.json metadata was not resolvable"
    },
    {
      "toolId": "hyperframe",
      "checkKind": "node_package_metadata",
      "checkName": "node_package_metadata_hyperframe",
      "status": "not_installed",
      "optional": true,
      "manualReviewRequired": false,
      "sanitizedEvidence": "Optional hyperframe/package.json metadata was not resolvable"
    },
    {
      "toolId": "ffmpeg_lgpl_policy",
      "checkKind": "manual_review",
      "checkName": "ffmpeg_lgpl_safe_build_manual_review",
      "status": "pending_manual_review",
      "optional": false,
      "manualReviewRequired": true,
      "sanitizedEvidence": "FFmpeg commercial LGPL-safe build verification remains pending"
    },
    {
      "toolId": "revideo",
      "checkKind": "registry_policy",
      "checkName": "revideo_evaluation_only_policy",
      "status": "evaluation_only",
      "optional": false,
      "manualReviewRequired": true,
      "sanitizedEvidence": "Revideo remains evaluation-only and blocked from production readiness"
    }
  ],
  "resultRegisterConclusion": {
    "resultCount": 16,
    "requiredPassed": 2,
    "requiredMissing": 8,
    "optionalWarning": 1,
    "optionalNotInstalled": 3,
    "manualOrPolicyBlocked": 2,
    "requiredLaunchCoreDependenciesReady": false,
    "safeToProceedToInstallPlan": true,
    "safeToProceedToRuntimeBeta": false,
    "safeToProceedToPaidProduction": false
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

The register records sanitized proof evidence only. It intentionally excludes raw command output, media paths, artifacts, secrets, and environment payloads.
