# WORKER_RUNTIME_JOBS SOUND CPU Phase 151 Index Export Source Plan

```json worker-runtime-jobs-sound-cpu-phase151-index-export-source-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase151-index-export-source-plan",
  "sourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "indexPath": "server/workers/sound-cpu/index.ts",
  "plannedExportBlock": {
    "exportConstants": [
      "SOUND_CPU_DISPATCH_CONTRACT_VERSION",
      "SOUND_CPU_DISPATCH_ALLOWED_WORKERS",
      "SOUND_CPU_DISPATCH_ALLOWED_IMAGES",
      "SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES",
      "SOUND_CPU_DISPATCH_DISABLED_RUNTIME_FLAGS"
    ],
    "exportHelpers": [
      "validateSoundCpuDispatchContractPayload",
      "buildDisabledSoundCpuDispatchEnvelope"
    ],
    "exportTypes": [
      "SoundCpuDispatchContractPayload",
      "SoundCpuDisabledDispatchEnvelope",
      "SoundCpuDispatchValidationResult"
    ]
  },
  "sourceChangeAllowedInThisGate": false,
  "executionAllowedInThisGate": false
}
```

The future source change should add exports only. It must not wire dispatch execution.
