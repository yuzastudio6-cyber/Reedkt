# WORKER_RUNTIME_JOBS SOUND CPU Persistent Runtime Install Claim Policy

```json worker-runtime-jobs-sound-cpu-persistent-runtime-install-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof_plan",
  "allowedClaims": {
    "persistentRuntimeTargetSelected": true,
    "selectedTargetPath": "server/workers/sound-cpu/Dockerfile",
    "packageProofReadyForPlanningCount": 15,
    "syntheticToolCallProbePassedCount": 15,
    "controlledLocalDockerBuildProofAccepted": true,
    "nextSafeGateIsControlledImageRuntimeImportProofPlan": true
  },
  "forbiddenClaims": [
    "persistent runtime install ready",
    "durable image artifact ready",
    "container runtime import proof passed",
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
    "packageInstallAttempted": false,
    "toolCallAttempted": false,
    "dockerBuildAttempted": false,
    "dockerRunAttempted": false,
    "dockerPushAttempted": false,
    "gcpCloudRunAttempted": false,
    "providerCallAttempted": false,
    "modelCallAttempted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "mediaProcessingAttempted": false,
    "supabaseMutationAttempted": false,
    "sqlExecutionAttempted": false,
    "artifactCreationAttempted": false,
    "billingOrStripeMutationAttempted": false
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
