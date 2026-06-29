# WORKER_RUNTIME_JOBS SOUND CPU Evaluation-Only Readiness Semantics Source Change Map

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-map
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime",
  "sourceFilesToReview": [
    {
      "path": "server/workers/production-readiness/production-tool-readiness-specs.ts",
      "currentSemantics": "blocksProductionIfMissing includes profile.productionStatus === 'evaluation_only'",
      "plannedChange": "Remove evaluation_only as an independent hard-production blocker; preserve productionRequired, modelWeightsRequired, and needs_license_review blockers.",
      "mustPreserve": [
        "readinessStatusWhenMissing returns evaluation_only for evaluation-only profiles",
        "checkModes includes evaluation_blocked for evaluation-only profiles",
        "model-weight checks remain present for evaluation-only tools that require weights"
      ]
    },
    {
      "path": "server/workers/production-readiness/production-tool-readiness-policy.ts",
      "currentSemantics": "assertRevideoReadinessBlocked requires Revideo to be production-blocked and not launch core",
      "plannedChange": "Replace the static production-block requirement with an assertion that Revideo remains evaluation-only, non-launch-core, and execution-blocked by runtime policy.",
      "mustPreserve": [
        "Revideo stays evaluation_only",
        "Revideo stays non-launch-core",
        "Revideo stays forbidden from render/core production execution"
      ]
    },
    {
      "path": "server/workers/readiness-validation/production-readiness-report-builder.ts",
      "currentSemantics": "statusBlocksProduction includes evaluation_only and buildToolBlockers emits hard blockers for every evaluation-only profile",
      "plannedChange": "Keep evaluation-only visible in status fields, but emit static hard blockers only when the tool is launch-core, model-weight blocked, license blocked, or explicitly requested for production execution.",
      "mustPreserve": [
        "whisper_cpp remains hard-blocked through model-weight review",
        "transparent_background remains hard-blocked through model-weight review",
        "revideo remains evaluation_only but becomes a static warning/non-launch-core visibility item"
      ]
    },
    {
      "path": "server/workers/readiness-validation/production-readiness-blocker-policy.ts",
      "currentSemantics": "evaluation_only_production_execution and revideo_production_execution are hard blockers",
      "plannedChange": "Preserve hard blockers for actual production execution requests; add or reuse warning-level static visibility semantics for non-launch-core evaluation-only tools if needed.",
      "mustPreserve": [
        "execution blockers stay hard",
        "no runtime allowlist is widened",
        "no production execution path is opened"
      ]
    },
    {
      "path": "server/workers/readiness-validation/production-readiness-summary.ts",
      "currentSemantics": "summary counts hard blockers from blockerSummaries and statuses independently",
      "plannedChange": "Keep evaluation_only status counts visible while letting hard-blocker counts reflect only real readiness blockers.",
      "mustPreserve": [
        "evaluationOnlyTools remains visible",
        "overall status remains blocked while model-weight and launch-core blockers exist",
        "external beta and production summaries do not unlock real-user media or paid production"
      ]
    },
    {
      "path": "server/tool-registry/tool-runtime-policy.ts",
      "currentSemantics": "productionExecutionAllowed is false for evaluation-only tools",
      "plannedChange": "No source change expected; future source-change gate must assert this file still denies evaluation-only execution.",
      "mustPreserve": [
        "productionExecutionAllowed: !evaluationOnly",
        "evaluateRuntimePolicy blocks Revideo production execution",
        "tool calls and worker execution remain denied"
      ]
    }
  ],
  "expectedToolOutcomesAfterFutureChange": [
    {
      "toolId": "whisper_cpp",
      "status": "evaluation_only",
      "hardBlockReason": "model_weight_review",
      "executionAllowed": false
    },
    {
      "toolId": "transparent_background",
      "status": "evaluation_only",
      "hardBlockReason": "model_weight_review",
      "executionAllowed": false
    },
    {
      "toolId": "revideo",
      "status": "evaluation_only",
      "hardBlockReason": "none_for_static_readiness_if_not_requested_for_execution",
      "executionAllowed": false
    }
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "blockedClaims": {
    "sourceReadinessCodeChanged": false,
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The future source-change gate should update code only after these semantics are accepted, then rerun readiness summaries to record the exact blocker-count delta.
