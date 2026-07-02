# WORKER_RUNTIME_JOBS SOUND CPU Phase 148 Dispatch Contract Source Register

```json worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase148-dispatch-contract-source-register",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "contractVersion": "phase148-fail-closed-v1",
  "exportsCreated": [
    "SOUND_CPU_DISPATCH_CONTRACT_VERSION",
    "SOUND_CPU_DISPATCH_ALLOWED_WORKERS",
    "SOUND_CPU_DISPATCH_ALLOWED_IMAGES",
    "SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES",
    "validateSoundCpuDispatchContractPayload",
    "buildDisabledSoundCpuDispatchEnvelope"
  ],
  "acceptedWorkers": [
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
  ],
  "runtimeDisabledFlags": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0"
  }
}
```

The created source is a contract module. It records allowed names and disabled defaults without dispatching work.
