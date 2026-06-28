# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Duplicate Blocker Register

```json worker-runtime-jobs-sound-cpu-native-runtime-duplicate-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_native_runtime_install_import_proof_blocked_native_ffmpeg_dylib_duplicate_warning_ready_for_split_manifest_plan_no_media_no_production",
  "blocker": {
    "id": "native_ffmpeg_dylib_duplicate_warning",
    "severity": "blocks_real_user_media_beta_and_production",
    "observedDuring": [
      "python same-process av + cv2 import",
      "python scenedetect import in environment containing av and OpenCV"
    ],
    "evidence": {
      "duplicateClasses": [
        "AVFFrameReceiver",
        "AVFAudioReceiver"
      ],
      "libraryA": "av/.dylibs/libavdevice.62.3.101.dylib",
      "libraryB": "cv2/.dylibs/libavdevice.61.3.100.dylib",
      "warningMeaning": "macOS runtime reports duplicated Objective-C classes and possible mysterious crashes"
    },
    "requiredFixDirection": "split PyAV and OpenCV/PySceneDetect proof/runtime manifests or otherwise enforce process isolation before source-install closure",
    "sourceInstallReviewMayCloseNow": false
  },
  "stillBlocked": {
    "sourceInstallReviewRequired": [
      "pyav",
      "pyscenedetect",
      "opencv",
      "sharp",
      "remotion"
    ],
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

This blocker is exactly why the proof result does not mark the native/runtime packages ready.
