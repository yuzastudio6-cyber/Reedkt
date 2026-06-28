# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Content Validation Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-validation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_creation_completed_with_warnings_ready_for_source_owner_review_no_install_no_media_no_production",
  "validationRules": {
    "sharedManifestContainsOnlyLowRiskManifestTools": true,
    "pyavManifestContainsOnlyPyAv": true,
    "opencvScenedetectManifestContainsOnlyOpenCvAndPySceneDetect": true,
    "combinedManifestStillExists": true,
    "noPackageInstallRanToday": true,
    "noMediaExecutionRanToday": true
  },
  "duplicateRiskHandling": {
    "sameProcessPyAvAndOpenCvStillForbidden": true,
    "isolatedProofStillRequired": true,
    "sourceInstallClosureStillBlocked": true
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

This validation covers source shape only; it does not prove import/runtime readiness.
