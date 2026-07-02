# WORKER_RUNTIME_JOBS SOUND CPU Phase 147 Source File Contract Plan

```json worker-runtime-jobs-sound-cpu-phase147-source-file-contract-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase147-source-file-contract-plan",
  "futureSourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "sourceCreationAllowedInThisGate": false,
  "plannedModuleKind": "fail_closed_static_dispatch_contract",
  "plannedExports": [
    "SOUND_CPU_DISPATCH_CONTRACT_VERSION",
    "SOUND_CPU_DISPATCH_ALLOWED_WORKERS",
    "SOUND_CPU_DISPATCH_ALLOWED_IMAGES",
    "SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES",
    "validateSoundCpuDispatchContractPayload",
    "buildDisabledSoundCpuDispatchEnvelope"
  ],
  "plannedConstants": {
    "workers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "images": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ]
  },
  "plannedBehavior": {
    "validateStaticPayloadShape": true,
    "buildDisabledEnvelope": true,
    "failClosedWithoutDispatch": true,
    "performWorkerDispatch": false,
    "claimLeaseJobs": false,
    "callRoutesOrTools": false,
    "mutateSupabaseJobRows": false,
    "writeArtifacts": false,
    "processMedia": false
  }
}
```

The future source module must remain a disabled static contract until a later gate explicitly approves dispatch execution.
