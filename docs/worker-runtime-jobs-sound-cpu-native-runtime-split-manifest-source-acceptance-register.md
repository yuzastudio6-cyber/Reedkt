# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Acceptance Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production",
  "acceptedForProofPlanning": [
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "accepted": true,
      "toolIds": [
        "duckdb",
        "polars",
        "opentimelineio"
      ]
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "accepted": true,
      "toolIds": [
        "pyav"
      ]
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "accepted": true,
      "toolIds": [
        "opencv",
        "pyscenedetect"
      ]
    }
  ],
  "notAcceptedToday": {
    "runtimeConsumerMigration": false,
    "packageInstall": false,
    "importProof": false,
    "mediaExecution": false,
    "betaUnlock": false,
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

Acceptance is intentionally scoped to proof planning only.
