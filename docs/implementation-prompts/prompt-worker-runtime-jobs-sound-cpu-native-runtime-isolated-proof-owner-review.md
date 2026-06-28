# WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-PROOF-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-PROOF-OWNER-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_passed_with_warnings_ready_for_source_install_closure_owner_review_no_media_no_production",
  "goal": "Review the isolated native runtime install/import proof and decide whether source-install review blockers may be closed without enabling media or production runtime.",
  "reviewInputs": [
    "docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-result.md",
    "docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register.md",
    "docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-source-install-closure-readiness.md"
  ],
  "allowedReviewScope": {
    "sourceInstallClosureReview": true,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
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

Review may accept the isolated proof as source-install closure evidence. It must not unlock runtime/media/beta/production readiness.
