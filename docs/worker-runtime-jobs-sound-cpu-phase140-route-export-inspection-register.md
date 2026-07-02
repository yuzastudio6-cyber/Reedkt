# WORKER_RUNTIME_JOBS SOUND CPU Phase 140 Route Export Inspection Register

```json worker-runtime-jobs-sound-cpu-phase140-route-export-inspection-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase140-route-export-inspection-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase140_controlled_no_media_route_import_validation_passed_with_warnings_ready_for_route_registration_plan",
  "routeExports": [
    "createSoundCpuWorkerJobRoute",
    "getSoundCpuWorkerJobStatusRoute",
    "createSoundCpuWorkerRoutes"
  ],
  "schemaExports": [
    "SOUND_CPU_WORKER_ROUTE_WORKER_NAMES",
    "SOUND_CPU_WORKER_ROUTE_IMAGES",
    "SOUND_CPU_WORKER_ROUTE_JOB_TYPES",
    "SOUND_CPU_WORKER_ROUTE_DISABLED_FLAGS"
  ],
  "acceptedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The import proof confirmed the expected exports and accepted planning set.
