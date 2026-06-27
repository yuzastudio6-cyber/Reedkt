# WORKER_RUNTIME_JOBS SOUND CPU Image Runtime Import Failure Claim Policy

```json worker-runtime-jobs-sound-cpu-image-runtime-import-failure-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan",
  "allowedClaims": {
    "sanitizedFailureDetailCaptured": true,
    "audiofluxFailureClass": "OSError",
    "pedalboardFailureClass": "ImportError",
    "pedalboardMissingLibrary": "libatomic.so.1",
    "imageCleanupPassed": true,
    "nextSafeGateIsDockerfileRuntimeDependencyFixPlan": true
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
    "diagnosticDockerRunAttempted": true,
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
