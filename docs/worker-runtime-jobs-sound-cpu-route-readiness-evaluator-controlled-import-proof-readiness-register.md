# WORKER_RUNTIME_JOBS SOUND CPU Route Readiness Evaluator Controlled Import Proof Readiness Register

```json worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-readiness-register
{
  "decision": "worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof",
  "controlledImportProofMayProceed": {
    "importStaticIntegrationSource": true,
    "callStaticIntegrationEvaluationFunction": true,
    "assertFixtureCounts": true,
    "assertReadinessClaimFalse": true,
    "importRouteResolvers": false,
    "executeServerRoutes": false,
    "dispatchWorkers": false,
    "executeWorkers": false,
    "executeTools": false,
    "openMedia": false,
    "runDockerOrGcp": false,
    "touchSupabaseOrSql": false,
    "createArtifacts": false,
    "unlockReadiness": false
  },
  "expectedControlledProofCounts": {
    "fixtureCount": 9,
    "acceptedFixtureCount": 4,
    "rejectedPayloadFieldCount": 14,
    "mismatchCaseCount": 5
  }
}
```
