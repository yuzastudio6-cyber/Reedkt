# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Isolated Proof Pass Fail Register

```json worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-pass-fail-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_plan_completed_with_warnings_ready_for_controlled_isolated_install_import_proof_no_media_no_production",
  "futurePassCriteria": {
    "eachManifestInstallsInItsOwnTemporaryVenv": true,
    "metadataVersionsMatchManifestPins": true,
    "importsPassInEachIsolatedLane": true,
    "noNativeDuplicateClassWarningInAnyIsolatedLane": true,
    "noMediaFileOpen": true,
    "temporaryVenvsRemoved": true,
    "packageLockUnchanged": true
  },
  "futureBlockedDecisions": [
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_install_failure",
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_metadata_mismatch",
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_import_failure",
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_native_duplicate_warning",
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_media_execution_detected",
    "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_blocked_safety_scan"
  ],
  "sourceInstallClosureAfterFuturePass": {
    "mayConsiderClosureFor": [
      "pyav",
      "pyscenedetect",
      "opencv"
    ],
    "closureRequiresOwnerReview": true,
    "closureApprovedToday": false
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

A future passing proof is still not an automatic beta or production unlock.
