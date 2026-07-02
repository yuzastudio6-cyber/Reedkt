# WORKER_RUNTIME_JOBS SOUND CPU Phase 142 Disabled Route Metadata Alignment Register

```json worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-disabled-route-metadata-alignment-register",
  "alignedSource": "server/routes/sound-cpu-worker-routes.ts",
  "alignedFields": {
    "SoundCpuWorkerRouteDisabledResponse.routeRegisteredInApp": true,
    "createSoundCpuRouteDisabledResponse.routeRegisteredInApp": true
  },
  "unchangedRuntimeGuards": {
    "soundCpuWorkerRouteExecutionEnabled": false,
    "workerDispatchStarted": false,
    "mediaProcessingStarted": false,
    "supabaseMutationStarted": false,
    "sqlExecutionStarted": false,
    "artifactCreated": false
  },
  "requestExecutionDuringAlignment": false
}
```

Only stale disabled-response metadata was aligned; no route request was sent.
