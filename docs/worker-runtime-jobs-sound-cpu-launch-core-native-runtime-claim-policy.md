# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Native Runtime Claim Policy

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_source_install_review_completed_with_warnings_ready_for_native_runtime_install_proof_plan_no_runtime_no_production",
  "allowedClaims": {
    "nativeRuntimeSourceInstallReviewCompleted": true,
    "nativeRuntimeInstallProofMayBePlanned": true,
    "boundedExternalBetaAllowedNoRuntimeNoRealMedia": true
  },
  "blockedClaims": {
    "sourceInstallReviewClosedForNativeRuntimeTargets": false,
    "generatedLocalFixturePassedClaimedToday": false,
    "dryRunPassedClaimedToday": false,
    "runtimeReadinessClaimedToday": false,
    "workerReadinessClaimedToday": false,
    "mediaReadinessClaimedToday": false,
    "imageReadinessClaimedToday": false,
    "remotionReadinessClaimedToday": false,
    "runtimeExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "toolExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "imageProcessingApprovedToday": false,
    "remotionRenderingApprovedToday": false,
    "dockerBuildRunPushApprovedToday": false,
    "gcpCloudRunSecretManagerApprovedToday": false,
    "supabaseMutationApprovedToday": false,
    "sqlExecutionApprovedToday": false,
    "artifactDeliveryApprovedToday": false,
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

This packet does not widen runtime claims. It only narrows the next proof work.
