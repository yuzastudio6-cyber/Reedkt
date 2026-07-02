# WORKER_RUNTIME_JOBS SOUND CPU Phase159 Disabled Route Source Register

```json worker-runtime-jobs-sound-cpu-phase159-disabled-route-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase159-disabled-route-source-register",
  "routeSourcePath": "server/workers/sound-cpu/disabled-dispatch-route.ts",
  "createdExports": [
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME",
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS",
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON",
    "SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON",
    "createSoundCpuDisabledDispatchRouteResult",
    "assertSoundCpuDisabledDispatchRouteExecutionBlocked"
  ],
  "createdTypes": [
    "SoundCpuDisabledDispatchRouteInput",
    "SoundCpuDisabledDispatchRouteInvalidPayloadResult",
    "SoundCpuDisabledDispatchRouteResult"
  ],
  "sourceBehavior": {
    "validPayloadReturnsAcceptedForDispatch": false,
    "invalidPayloadReturnsAcceptedForDispatch": false,
    "noWorkerExecution": true,
    "noRouteExecution": true,
    "noSupabaseMutation": true,
    "noSqlExecution": true,
    "noMediaProcessing": true,
    "noArtifactCreated": true
  },
  "routeRegisteredToday": false,
  "indexExportAddedToday": false
}
```
