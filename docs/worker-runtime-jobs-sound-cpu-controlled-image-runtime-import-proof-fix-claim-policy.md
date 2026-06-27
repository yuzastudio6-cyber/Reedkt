# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Fix Claim Policy

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics",
  "allowedClaims": {
    "stdinSafeProbeProducedJson": true,
    "metadataPassedCount": 13,
    "importPassedCount": 12,
    "importFailedCount": 2,
    "imageCleanupPassed": true,
    "nextSafeGateIsImportFailureDiagnostics": true
  },
  "forbiddenClaims": [
    "container runtime import proof passed",
    "all imports passed inside image",
    "persistent runtime install ready",
    "durable image artifact ready",
    "Docker image ready for push",
    "Docker image ready for Cloud Run",
    "product tool-call execution ready",
    "worker execution ready",
    "route execution ready",
    "media processing ready",
    "Supabase SQL ready",
    "artifact delivery ready",
    "internal beta ready",
    "external beta ready",
    "paid production ready",
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime readiness"
  ],
  "runtimeFlags": {
    "dockerBuildAttempted": true,
    "dockerRunAttempted": true,
    "dockerPushAttempted": false,
    "gcpCloudRunAttempted": false,
    "providerCallAttempted": false,
    "modelCallAttempted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "toolExecutionAttempted": false,
    "mediaProcessingAttempted": false,
    "supabaseMutationAttempted": false,
    "sqlExecutionAttempted": false,
    "artifactCreationAttempted": false,
    "billingOrStripeMutationAttempted": false,
    "externalBetaUnlockAttempted": false,
    "productionUnlockAttempted": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
