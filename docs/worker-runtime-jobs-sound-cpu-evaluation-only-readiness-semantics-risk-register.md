# WORKER_RUNTIME_JOBS SOUND CPU Evaluation-Only Readiness Semantics Risk Register

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-risk-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime",
  "risks": [
    {
      "id": "execution_block_confused_with_readiness_visibility",
      "severity": "high",
      "risk": "A future source change could accidentally treat evaluation-only visibility as execution approval.",
      "mitigation": "Require tool-runtime-policy assertions proving productionExecutionAllowed stays false for evaluation-only tools."
    },
    {
      "id": "model_weight_blocker_accidentally_removed",
      "severity": "high",
      "risk": "whisper_cpp or transparent_background could lose model-weight hard blockers while removing evaluation-only hard blocks.",
      "mitigation": "Keep modelWeightsRequired and model-weight manifest blockers independent of evaluation-only status."
    },
    {
      "id": "historical_diagnostics_rewritten",
      "severity": "medium",
      "risk": "Earlier packet diagnostics could be rewritten instead of preserved as historical source evidence.",
      "mitigation": "Create new source-change diagnostics and consume earlier packets as immutable evidence."
    },
    {
      "id": "duplicate_lane_collision",
      "severity": "medium",
      "risk": "Other chats may be working QWEN, AI graphics, AI B-roll, or model/GPU lanes.",
      "mitigation": "Keep this lane limited to WORKER_RUNTIME_JOBS readiness semantics for evaluation-only static accounting."
    },
    {
      "id": "beta_readiness_widening",
      "severity": "high",
      "risk": "Lowering static hard blockers could be mistaken for real-user media beta or paid production approval.",
      "mitigation": "Require beta summaries and claim policy to keep real-user media beta and paid production closed."
    }
  ],
  "duplicateLanePolicy": {
    "qwenRepresentativePr": 1542,
    "aiBrollRepresentativePr": 962,
    "aiGraphicsRepresentativePrs": [
      856,
      833
    ],
    "thisLaneMayEdit": [
      "readiness semantics source plan docs",
      "future source-change prompt for production-readiness static accounting"
    ],
    "thisLaneMustNotEdit": [
      "model/GPU ownership",
      "provider routing",
      "AI graphics runtime",
      "AI B-roll runtime",
      "QWEN backend runtime",
      "media processing execution"
    ]
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "blockedClaims": {
    "sourceReadinessCodeChanged": false,
    "modelDownload": false,
    "modelWeightMount": false,
    "providerModelCall": false,
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "artifactCreation": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The safe path is small: plan, then one bounded source change, then owner review. It should not touch other active model/provider/media lanes.
