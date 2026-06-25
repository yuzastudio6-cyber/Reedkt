# WORKER_RUNTIME_JOBS SOUND CPU Synthetic Route Proof Beta Boundary Register

```json worker-runtime-jobs-sound-cpu-synthetic-route-proof-beta-boundary-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_synthetic_route_proof_owner_review_passed_with_warnings_ready_for_synthetic_route_source_plan",
  "betaBoundary": {
    "syntheticRouteProofAccepted": true,
    "syntheticRouteSourcePlanningMayProceed": true,
    "controlledSyntheticRouteExecutionMayProceed": false,
    "workerExecutionMayProceedForBeta": false,
    "realUserMediaBetaAllowed": false,
    "externalBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "requiredBeforeControlledSyntheticRouteExecution": [
    "source-level synthetic route plan",
    "owner review of source-level synthetic route plan",
    "explicit fail-closed source implementation gate",
    "separate no-media execution proof prompt"
  ]
}
```
