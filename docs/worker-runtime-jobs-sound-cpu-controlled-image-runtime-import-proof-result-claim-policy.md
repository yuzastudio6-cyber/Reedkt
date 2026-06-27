# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Result Claim Policy

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-result-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix",
  "allowedClaims": {
    "controlledLocalDockerBuildPassed": true,
    "imageInspectPassed": true,
    "imageCleanupPassed": true,
    "probeInvocationBlockerRecorded": true,
    "nextSafeGateIsControlledImageRuntimeImportProofFix": true
  },
  "forbiddenClaims": [
    "container runtime import proof passed",
    "metadata imports passed inside image",
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
