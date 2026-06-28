# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Owner Content Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-content-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production",
  "contentReview": {
    "sharedManifestExact": [
      "duckdb==1.5.4",
      "polars==1.42.0",
      "opentimelineio==0.18.1"
    ],
    "pyavManifestExact": [
      "av==17.1.0"
    ],
    "opencvScenedetectManifestExact": [
      "scenedetect==0.7",
      "opencv-python-headless==4.13.0.92"
    ],
    "combinedManifestPreserved": true,
    "versionsMatchCombinedManifest": true
  },
  "duplicateRiskReview": {
    "pyavAndOpenCvStillMustNotShareSamePythonProcess": true,
    "isolatedProofStillRequired": true,
    "sameProcessPolicyStillBlocked": true
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

The split files match the planned source contents and preserve the combined manifest for compatibility.
