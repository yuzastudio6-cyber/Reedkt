# WORKER_RUNTIME_JOBS SOUND CPU Phase199 Synthetic HTTP Request Plan

```json worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase199-synthetic-http-request-plan",
  "futureSyntheticRequest": {
    "method": "POST",
    "targetRoute": "/api/workers/sound-cpu/jobs",
    "idempotencyHeader": "synthetic-non-secret-idempotency-key",
    "contentType": "application/json",
    "workerName": "sound-cpu-analysis-worker",
    "imageName": "reeditpro/sound-cpu-analysis-worker",
    "jobType": "sound.package_import_smoke",
    "rawPromptAllowed": false,
    "secretPayloadAllowed": false,
    "serviceRolePayloadAllowed": false,
    "signedUrlAsSourceOfTruthAllowed": false
  },
  "currentGateRequestSent": false
}
```
