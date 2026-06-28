# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Path Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-path-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production",
  "plannedSourcePaths": [
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "status": "planned_not_created",
      "purpose": "low-risk launch-core metadata/data packages without the PyAV/OpenCV native dylib collision"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "status": "planned_not_created",
      "purpose": "isolated PyAV metadata/import proof lane"
    },
    {
      "path": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "status": "planned_not_created",
      "purpose": "isolated OpenCV/PySceneDetect metadata/import proof lane"
    }
  ],
  "existingSourcePathRetained": {
    "path": "server/workers/sound-cpu/requirements.launch-core.txt",
    "status": "unchanged_in_this_gate",
    "reason": "source creation and compatibility review are deferred to the explicit source-creation gate"
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

No manifest file is created in this planning gate.
