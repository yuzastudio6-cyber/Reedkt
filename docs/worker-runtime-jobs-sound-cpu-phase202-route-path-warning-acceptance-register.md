# WORKER_RUNTIME_JOBS SOUND CPU Phase202 Route Path Warning Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase202-route-path-warning-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase202-route-path-warning-acceptance-register",
  "routePathWarning": {
    "phase199PlannedRoute": "/api/workers/sound-cpu/jobs",
    "sourceRegisteredRoute": "/v1/sound-cpu/jobs",
    "sourceRegisteredRouteEvidence": "server/routes/sound-cpu-worker-routes.ts registers router.post('/v1/sound-cpu/jobs', ...)",
    "phase143PriorProofUsedSourceRegisteredRoute": true,
    "phase201ProofUsedSourceRegisteredRoute": true,
    "warningAccepted": true,
    "ownerReviewDisposition": "accept source-registered /v1 route for proof evidence; keep /api planned-route drift open for later route metadata reconciliation if product APIs require the /api shape",
    "duplicateRouteProofRequired": false,
    "routeRetargetingEnabled": false,
    "broadRouteReadinessClaimed": false
  }
}
```

The warning is evidence, not a request to rerun the preflight against a different URL.
