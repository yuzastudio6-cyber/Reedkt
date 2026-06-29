# WORKER_RUNTIME_JOBS SOUND CPU Evaluation-Only Production Selection Policy After Model GPU Routing

```json worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_evaluation_only_production_selection_policy_after_model_gpu_routing_completed_with_warnings_ready_for_readiness_semantics_source_plan_no_runtime",
  "sourceBase": {
    "sourceHead": "bca6b820ed7559a3a6902106c0ae621c644b4ecf",
    "sourcePr": 1549,
    "sourceTitle": "[workers] SOUND CPU model GPU blocker routing",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime"
  },
  "policyDecision": {
    "evaluationOnlyToolsReviewed": [
      "whisper_cpp",
      "transparent_background",
      "revideo"
    ],
    "acceptedForLaunchCoreProductionSelectionToday": false,
    "acceptedForToolCallExecutionToday": false,
    "acceptedForWorkerExecutionToday": false,
    "acceptedForMediaProcessingToday": false,
    "acceptedForRealUserMediaBetaToday": false,
    "acceptedForPaidProductionToday": false,
    "currentReadinessSemanticsGapFound": true,
    "sourceSemanticsPlanRequiredBeforeCodeChange": true
  },
  "selectedNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-PLAN-AFTER-POLICY",
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
    "supabaseMutation": false,
    "sqlExecution": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The reviewed evaluation-only tools are not launch-core execution dependencies today. They remain blocked from tool calls, worker execution, media processing, real-user media beta, and paid production. The safe next step is a source-semantics plan that can decide how to separate “blocked from execution” from “hard-blocking all readiness” without weakening runtime safeguards.
