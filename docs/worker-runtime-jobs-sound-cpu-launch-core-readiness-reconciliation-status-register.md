# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Readiness Reconciliation Status Register

```json worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-status-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_readiness_reconciliation_after_persistent_manifest_review_completed_with_warnings_ready_for_source_install_review_no_runtime_no_production",
  "manifestBackedSourceInstallReviewTools": [
    "pyav",
    "pyscenedetect",
    "opencv",
    "duckdb",
    "polars",
    "opentimelineio",
    "sharp",
    "remotion"
  ],
  "stillMissingLaunchCoreTools": [
    "ffmpeg",
    "ffprobe",
    "hyperframe",
    "libass"
  ],
  "statusMapping": {
    "manifestBackedMissing": "source_install_review_required",
    "manifestBackedNotInstalled": "source_install_review_required",
    "commandOrManualToolsWithoutManifest": "missing",
    "modelWeightTools": "needs_model_weight_review"
  },
  "validationSnapshot": {
    "sourceInstallReviewRequired": 8,
    "missing": 6,
    "notInstalled": 13,
    "hardBlockers": 84,
    "warnings": 26
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

`source_install_review_required` is still a blocker for production use; it is simply more precise than `missing`.
