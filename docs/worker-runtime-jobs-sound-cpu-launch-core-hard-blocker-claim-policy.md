# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Hard Blocker Claim Policy

```json worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_hard_blocker_closure_plan_completed_with_warnings_ready_for_hyperframe_package_identity_owner_review_no_media_no_production",
  "allowedClaims": {
    "hardBlockerClosurePlanCreated": true,
    "nextLaneSelected": "hyperframe_package_identity_owner_review",
    "boundedNoRuntimeExternalBetaAllowed": true,
    "duplicateRiskChecked": true
  },
  "blockedClaims": {
    "hyperframeResolved": false,
    "ffmpegCommercialLgplReady": false,
    "ffprobeContainerReady": false,
    "libassReady": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "mediaReadinessClaimed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false,
    "runtimeExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "toolExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "dockerBuildRunPushApprovedToday": false,
    "gcpCloudRunSecretManagerApprovedToday": false,
    "supabaseMutationApprovedToday": false,
    "sqlExecutionApprovedToday": false,
    "artifactDeliveryApprovedToday": false
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

This packet may claim a chosen next lane only. It must not claim a production readiness unlock.
