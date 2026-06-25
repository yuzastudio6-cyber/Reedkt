# WORKER_RUNTIME_JOBS SOUND CPU Route Resolver Import Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-route-resolver-import-owner-claim-policy
{
  "decision": "worker_runtime_jobs_sound_cpu_route_resolver_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof",
  "allowedClaims": {
    "gate2wAcceptedForControlledImportProof": true,
    "controlledImportProofMayProceed": true,
    "routeResolverImportApprovedForFutureProofOnly": true,
    "routeResolverImportedToday": false,
    "serverRouteImportedToday": false,
    "serverRouteExecutedToday": false,
    "workerExecutionRunToday": false,
    "routeReadinessClaimAllowedToday": false,
    "runtimeReadinessClaimed": false,
    "mediaReadinessClaimed": false,
    "betaReadinessClaimed": false,
    "productionReadinessClaimed": false
  },
  "forbiddenClaims": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "route_readiness_passed",
    "worker_readiness_passed",
    "runtime_readiness_passed",
    "beta_ready",
    "production_ready"
  ]
}
```
