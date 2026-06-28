# WORKER_RUNTIME_JOBS SOUND CPU Controlled Native Runtime Python Proof Register

```json worker-runtime-jobs-sound-cpu-controlled-native-runtime-python-proof-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_native_runtime_install_import_proof_blocked_native_ffmpeg_dylib_duplicate_warning_ready_for_split_manifest_plan_no_media_no_production",
  "pythonProof": {
    "venvLocation": "/private/tmp/reeditpro-native-runtime-install-proof-<timestamp>/venv",
    "venvInsideRepo": false,
    "installSource": "server/workers/sound-cpu/requirements.launch-core.txt",
    "metadataVersions": {
      "av": "17.1.0",
      "scenedetect": "0.7",
      "opencv-python-headless": "4.13.0.92",
      "duckdb": "1.5.4",
      "polars": "1.42.0",
      "opentimelineio": "0.18.1"
    },
    "isolatedImportChecks": {
      "av": "passed",
      "cv2": "passed",
      "scenedetect": "passed_with_native_duplicate_warning"
    },
    "combinedImportCheck": {
      "avAndCv2ExitCode": "passed",
      "nativeDuplicateWarningDetected": true,
      "duplicateClasses": [
        "AVFFrameReceiver",
        "AVFAudioReceiver"
      ],
      "conflictingLibraries": [
        "av/.dylibs/libavdevice.62.3.101.dylib",
        "cv2/.dylibs/libavdevice.61.3.100.dylib"
      ]
    },
    "temporaryPythonVenvRemoved": true,
    "mediaOpened": false,
    "imageOrVideoProcessed": false,
    "artifactCreated": false
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

The warning is treated as a blocker because same-process PyAV/OpenCV/PySceneDetect co-loading is not professional beta evidence.
