# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Blocker Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "blockers": [
    {
      "id": "native_ffmpeg_dylib_duplicate_warning",
      "status": "planned_for_isolation_fix",
      "blocks": [
        "real_user_media_beta",
        "paid_production",
        "native_runtime_source_install_closure"
      ],
      "nextRequiredAction": "create isolated manifests and rerun isolated metadata/import proof"
    },
    {
      "id": "same_process_pyav_opencv_policy_missing",
      "status": "open",
      "blocks": [
        "worker_runtime_policy",
        "route_execution_policy"
      ],
      "nextRequiredAction": "owner-review process isolation policy after source manifest proof"
    }
  ],
  "closureToday": {
    "sourceInstallReviewClosedCountThisGate": 0,
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

The blocker is now narrowed to a concrete source-plan action, but it is not closed.
