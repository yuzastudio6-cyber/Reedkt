# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source File Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-file-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_creation_completed_with_warnings_ready_for_source_owner_review_no_install_no_media_no_production",
  "createdFiles": [
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "lines": [
        "duckdb==1.5.4",
        "polars==1.42.0",
        "opentimelineio==0.18.1"
      ],
      "lane": "shared_low_risk_metadata"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "lines": [
        "av==17.1.0"
      ],
      "lane": "pyav_isolated_native_video"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "lines": [
        "scenedetect==0.7",
        "opencv-python-headless==4.13.0.92"
      ],
      "lane": "opencv_scenedetect_isolated_native_video"
    }
  ],
  "unchangedFiles": [
    "server/workers/sound-cpu/requirements.launch-core.txt"
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

The split files intentionally preserve the versions from the existing combined launch-core manifest.
