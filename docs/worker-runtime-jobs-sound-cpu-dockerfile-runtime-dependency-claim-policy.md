# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Claim Policy

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix",
  "allowedClaims": {
    "pedalboardFixPlanned": true,
    "pedalboardPlannedDebianPackage": "libatomic1",
    "audiofluxArchitectureMismatchIdentified": true,
    "audiofluxAmd64LanePlanned": true,
    "dockerImageRemovedAfterDiagnostics": true
  },
  "blockedClaims": {
    "dockerfileSourceChanged": false,
    "containerRuntimeImportProofPassed": false,
    "all15ToolsRuntimeReady": false,
    "productToolCallsReady": false,
    "dockerPushReady": false,
    "gcpCloudRunReady": false,
    "workerExecutionReady": false,
    "mediaProcessingReady": false,
    "externalBetaReady": false,
    "productionReady": false,
    "generatedLocalFixturePassed": false,
    "dryRunPassed": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "scopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker usage was limited to controlled local package-layout/runtime dependency diagnostics and cleanup; no Docker push or product/runtime execution was enabled."
}
```
