# WORKER_RUNTIME_JOBS SOUND CPU Phase 149 Source Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase149-source-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase149-source-owner-acceptance-register",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "acceptedSourceProperties": {
    "contractVersion": "phase148-fail-closed-v1",
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
    "disabledRuntimeFlags": true,
    "disabledEnvelope": true,
    "payloadValidation": true
  },
  "acceptedForExecutionToday": false,
  "acceptedForStaticImportValidation": true
}
```

Owner acceptance is limited to source shape and static import validation.
