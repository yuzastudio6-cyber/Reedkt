# WORKER_RUNTIME_JOBS SOUND CPU Controlled Native Runtime Isolated Lane Proof Register

```json worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_passed_with_warnings_ready_for_source_install_closure_owner_review_no_media_no_production",
  "laneProofs": [
    {
      "lane": "shared",
      "requirements": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "metadataVersions": {
        "duckdb": "1.5.4",
        "polars": "1.42.0",
        "opentimelineio": "0.18.1"
      },
      "imports": [
        "duckdb",
        "polars",
        "opentimelineio"
      ],
      "installSucceeded": true,
      "metadataPassed": true,
      "importsPassed": true,
      "nativeDuplicateWarningDetected": false,
      "venvInsideRepo": false
    },
    {
      "lane": "pyav",
      "requirements": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "metadataVersions": {
        "av": "17.1.0"
      },
      "imports": [
        "av"
      ],
      "installSucceeded": true,
      "metadataPassed": true,
      "importsPassed": true,
      "nativeDuplicateWarningDetected": false,
      "venvInsideRepo": false
    },
    {
      "lane": "opencv_scenedetect",
      "requirements": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "metadataVersions": {
        "scenedetect": "0.7",
        "opencv-python-headless": "4.13.0.92"
      },
      "imports": [
        "cv2",
        "scenedetect"
      ],
      "installSucceeded": true,
      "metadataPassed": true,
      "importsPassed": true,
      "nativeDuplicateWarningDetected": false,
      "venvInsideRepo": false
    }
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The proof lanes remained isolated. The previous combined-manifest native duplicate warning did not reproduce in any split lane.
