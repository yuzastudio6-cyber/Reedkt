# WORKER_RUNTIME_JOBS SOUND CPU Phase 143 Disabled Route Proof Evidence Register

```json worker-runtime-jobs-sound-cpu-phase143-disabled-route-proof-evidence-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase143-disabled-route-proof-evidence-register",
  "proofCommand": "npm run worker-runtime-jobs:sound-cpu-phase143-controlled-disabled-route-request-validation:proof",
  "runner": "scripts/validation/worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-runner.ts",
  "requests": [
    {
      "method": "POST",
      "path": "/v1/sound-cpu/jobs",
      "syntheticPayloadOnly": true,
      "status": 409,
      "errorCode": "ROUTE_EXECUTION_NOT_ENABLED",
      "accepted": false,
      "operation": "createSoundCpuWorkerJobRoute"
    },
    {
      "method": "GET",
      "path": "/v1/sound-cpu/jobs/sound-cpu-disabled-route-proof-job-001",
      "syntheticPayloadOnly": true,
      "status": 409,
      "errorCode": "ROUTE_EXECUTION_NOT_ENABLED",
      "accepted": false,
      "operation": "getSoundCpuWorkerJobStatusRoute"
    }
  ],
  "serverClosed": true
}
```

The proof uses a local loopback Express server and sanitized synthetic IDs only.
