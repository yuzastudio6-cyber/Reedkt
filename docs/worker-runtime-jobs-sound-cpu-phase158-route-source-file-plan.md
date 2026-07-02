# WORKER_RUNTIME_JOBS SOUND CPU Phase158 Route Source File Plan

```json worker-runtime-jobs-sound-cpu-phase158-route-source-file-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase158-route-source-file-plan",
  "futureRoutePath": "server/workers/sound-cpu/disabled-dispatch-route.ts",
  "futureExports": [
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME",
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS",
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON",
    "createSoundCpuDisabledDispatchRouteResult",
    "assertSoundCpuDisabledDispatchRouteExecutionBlocked"
  ],
  "futureTypes": [
    "SoundCpuDisabledDispatchRouteInput",
    "SoundCpuDisabledDispatchRouteResult"
  ],
  "sourceBehavior": {
    "importFromIndex": "server/workers/sound-cpu/index.ts",
    "validatePayloadWith": "validateSoundCpuDispatchContractPayload",
    "returnEnvelopeWith": "buildDisabledSoundCpuDispatchEnvelope",
    "invalidPayloadReturnsAcceptedForDispatch": false,
    "validPayloadReturnsAcceptedForDispatch": false,
    "mustNotCallWorkers": true,
    "mustNotClaimLease": true,
    "mustNotMutateSupabase": true,
    "mustNotWriteArtifacts": true
  },
  "routeSourceCreatedToday": false
}
```
