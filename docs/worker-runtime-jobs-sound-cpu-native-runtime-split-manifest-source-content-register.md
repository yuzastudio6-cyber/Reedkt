# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Content Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production",
  "plannedManifestContents": [
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "plannedLines": [
        "duckdb==1.5.4",
        "polars==1.42.0",
        "opentimelineio==0.18.1"
      ],
      "sourceInstallStatus": "pending_manual_review_already_accepted_for_low_risk_manifest_context"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "plannedLines": [
        "av==17.1.0"
      ],
      "sourceInstallStatus": "source_install_review_required_until_isolated_proof_passes"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "plannedLines": [
        "scenedetect==0.7",
        "opencv-python-headless==4.13.0.92"
      ],
      "sourceInstallStatus": "source_install_review_required_until_isolated_proof_passes"
    }
  ],
  "plannedCompatibilityRule": {
    "preserveCurrentCombinedManifestUntilConsumerMigration": true,
    "doNotRemoveCurrentLaunchCoreManifestInSourceCreationGate": true,
    "doNotChangeWorkerRuntimeImportOrderInSourceCreationGate": true
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

The planned lines are copied from the current launch-core manifest and split by collision risk.
