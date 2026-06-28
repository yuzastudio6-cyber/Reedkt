# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Proof Handoff

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-proof-handoff
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production",
  "proofHandoff": {
    "sourceCreationGateMustCreateFilesBeforeProof": true,
    "proofGateMustUseIsolatedVenvsOutsideRepo": true,
    "requiredProofsAfterSourceCreationAndReview": [
      {
        "proofId": "shared_manifest_metadata_install",
        "manifestPath": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
        "expectedNoNativeDuplicateWarning": true
      },
      {
        "proofId": "pyav_manifest_metadata_import",
        "manifestPath": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
        "expectedNoNativeDuplicateWarning": true
      },
      {
        "proofId": "opencv_scenedetect_manifest_metadata_import",
        "manifestPath": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
        "expectedNoNativeDuplicateWarning": true
      }
    ],
    "forbiddenInProof": [
      "media file open",
      "decode",
      "scene detection execution",
      "worker execution",
      "route execution",
      "tool execution",
      "artifact write",
      "readiness unlock"
    ]
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

The follow-up proof must test isolated metadata/import behavior only.
