# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Proof Plan

```json worker-runtime-jobs-sound-cpu-native-runtime-split-proof-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "futureProofPlan": {
    "proofRunsPlannedAfterSourceGate": [
      {
        "proofId": "pyav_isolated_metadata_import",
        "manifestId": "sound_cpu_launch_core_pyav",
        "allowedCommands": [
          "python3 -m venv outside_repo_temp_venv",
          "pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.pyav.txt",
          "python -c \"import importlib.metadata as m; import av; print(m.version('av'))\""
        ],
        "forbidden": [
          "media file open",
          "decode",
          "encode",
          "worker execution",
          "route execution"
        ]
      },
      {
        "proofId": "opencv_scenedetect_isolated_metadata_import",
        "manifestId": "sound_cpu_launch_core_opencv_scenedetect",
        "allowedCommands": [
          "python3 -m venv outside_repo_temp_venv",
          "pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
          "python -c \"import importlib.metadata as m; import cv2; import scenedetect; print(m.version('opencv-python-headless'))\""
        ],
        "forbidden": [
          "media file open",
          "scene detection execution",
          "worker execution",
          "route execution"
        ]
      }
    ],
    "closureRequires": {
      "noDuplicateNativeClassWarningInEachIsolatedLane": true,
      "packageLockUnchanged": true,
      "temporaryVenvsRemoved": true,
      "noMediaExecution": true,
      "noRuntimeReadinessClaim": true
    }
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

The next proof must prove isolation, not merely repeat the combined import that already exposed the blocker.
