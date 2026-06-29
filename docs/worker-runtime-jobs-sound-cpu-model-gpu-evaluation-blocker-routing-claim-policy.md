# WORKER_RUNTIME_JOBS SOUND CPU Model GPU Evaluation Blocker Routing Claim Policy

```json worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime",
  "allowedClaims": {
    "sourcePr1545Merged": true,
    "currentBlockerRoutingCompleted": true,
    "duplicateModelGpuLaneAvoided": true,
    "evaluationOnlyPolicySelectedNext": true,
    "boundedExternalBetaScorecardStillAllowedNoRuntimeNoRealUserMedia": true
  },
  "blockedClaims": {
    "allToolsReadyForToolCalls": false,
    "allToolsReadyForExecution": false,
    "modelDownload": false,
    "modelWeightMount": false,
    "modelWeightApproval": false,
    "providerModelCall": false,
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "artifactCreation": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
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

This claim policy keeps the routing packet honest. The work selects the next safe closure; it does not make the model/GPU stack, evaluation-only tools, real-user media beta, or production ready.
