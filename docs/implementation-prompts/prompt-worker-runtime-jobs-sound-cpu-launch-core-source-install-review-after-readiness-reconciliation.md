# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-SOURCE-INSTALL-REVIEW-AFTER-READINESS-RECONCILIATION

```json worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-SOURCE-INSTALL-REVIEW-AFTER-READINESS-RECONCILIATION",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_readiness_reconciliation_after_persistent_manifest_review_completed_with_warnings_ready_for_source_install_review_no_runtime_no_production",
  "goal": "Review source-install readiness blockers for the eight persistent launch-core manifest entries without enabling runtime, media, Docker/GCP, Supabase, or production.",
  "sourceInstallReviewTargets": [
    "pyav",
    "pyscenedetect",
    "opencv",
    "duckdb",
    "polars",
    "opentimelineio",
    "sharp",
    "remotion"
  ],
  "blockedOrSeparateTargets": [
    "ffmpeg",
    "ffprobe",
    "libass",
    "hyperframe",
    "model-weight tools",
    "evaluation-only tools"
  ],
  "allowedInSourceInstallReview": {
    "staticSourceReview": true,
    "manifestParsing": true,
    "dependencyHydrationForValidationOnly": true,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "imageProcessing": false,
    "remotionRendering": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "externalBetaUnlock": false,
    "productionUnlock": false
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

Use this next prompt to decide which source-install blockers can be closed and which require separate native/license/runtime gates.
