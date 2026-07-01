# WORKER_RUNTIME_JOBS SOUND CPU Phase 73 Private Manifest Source Boundary Static Validation Register

```json worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-static-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-source-boundary-static-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_media_no_artifacts",
  "sourceBoundary": {
    "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "acceptedWorkerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "acceptedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "manifestTypePresent": true,
    "manifestInputTypePresent": true,
    "runtimeDefaultsFalsePresent": true,
    "validatorFunctionPresent": true,
    "acceptedForMediaProcessingTodayFalse": true,
    "acceptedForArtifactCreationTodayFalse": true,
    "acceptedForWorkerDispatchTodayFalse": true
  }
}
```

The private manifest source still exposes only planning-safe worker/job names and false runtime defaults.
