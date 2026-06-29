# WORKER_RUNTIME_JOBS SOUND CPU Evaluation-Only Readiness Semantics Gap Register

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-gap-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_evaluation_only_production_selection_policy_after_model_gpu_routing_completed_with_warnings_ready_for_readiness_semantics_source_plan_no_runtime",
  "currentSourceEvidence": {
    "readinessSpecsPath": "server/workers/production-readiness/production-tool-readiness-specs.ts",
    "policyPath": "server/workers/production-readiness/production-tool-readiness-policy.ts",
    "summaryPath": "server/workers/production-readiness/production-tool-readiness-summary.ts",
    "runtimePolicyPath": "server/tool-registry/tool-runtime-policy.ts",
    "currentEvaluationOnlyBlocksProductionIfMissing": true,
    "currentRevideoPolicyRequiresProductionBlocked": true,
    "currentRuntimePolicyBlocksEvaluationOnlyExecution": true
  },
  "semanticsGap": {
    "gapFound": true,
    "description": "Evaluation-only tools are correctly blocked from execution, but readiness accounting currently treats that execution block as a hard production readiness blocker even when the tool is not launch-core.",
    "mustNotChangeWithoutPlan": true
  },
  "requiredSourcePlanBeforeCodeChange": [
    "preserve evaluation_only status in summaries",
    "preserve execution block in tool-runtime policy",
    "preserve model-weight review blocks for evaluation tools that still require weights",
    "decide whether non-launch-core evaluation-only tools hard-block production readiness or remain visible warnings",
    "update smoke expectations only after source semantics are explicit"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "blockedClaims": {
    "modelDownload": false,
    "modelWeightMount": false,
    "providerModelCall": false,
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "artifactCreation": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The source gap is real, but changing it directly would touch readiness semantics and multiple smoke expectations. This register intentionally routes that work through a source-plan prompt first.
