# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Strategy Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-strategy-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "strategy": {
    "reason": "PyAV and OpenCV wheels both ship FFmpeg/libavdevice dylibs on macOS; same-process co-loading produced duplicate Objective-C class warnings.",
    "futureManifestPlan": [
      {
        "manifestId": "sound_cpu_launch_core_shared",
        "futurePath": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
        "toolIds": [
          "duckdb",
          "polars",
          "opentimelineio"
        ],
        "nativeCollisionRisk": "low",
        "sameProcessWithOtherLaunchCoreAllowedAfterProof": true
      },
      {
        "manifestId": "sound_cpu_launch_core_pyav",
        "futurePath": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
        "toolIds": [
          "pyav"
        ],
        "nativeCollisionRisk": "high",
        "sameProcessWithOpenCvLaneAllowedAfterProof": false
      },
      {
        "manifestId": "sound_cpu_launch_core_opencv_scenedetect",
        "futurePath": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
        "toolIds": [
          "opencv",
          "pyscenedetect"
        ],
        "nativeCollisionRisk": "high",
        "sameProcessWithPyAvLaneAllowedAfterProof": false
      }
    ],
    "currentManifestRetainedUntilSourceGate": "server/workers/sound-cpu/requirements.launch-core.txt",
    "sourceFilesCreatedToday": false
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

The split is a future source change, not a silent rewrite in this planning packet.
