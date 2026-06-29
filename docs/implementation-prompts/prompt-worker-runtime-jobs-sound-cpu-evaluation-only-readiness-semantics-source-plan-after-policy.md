# WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-PLAN-AFTER-POLICY

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-plan-after-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_evaluation_only_production_selection_policy_after_model_gpu_routing_completed_with_warnings_ready_for_readiness_semantics_source_plan_no_runtime",
  "goal": "Plan a source-level readiness semantics adjustment for evaluation-only tools without enabling execution or weakening runtime blocks.",
  "sourceHeadAtCreation": "bca6b820ed7559a3a6902106c0ae621c644b4ecf",
  "targetTools": [
    "whisper_cpp",
    "transparent_background",
    "revideo"
  ],
  "requiredPlanItems": [
    "distinguish execution-blocked from launch-core-readiness-hard-blocked",
    "preserve evaluation_only status visibility in readiness summaries",
    "preserve tool-runtime execution denial",
    "preserve model-weight review blockers where applicable",
    "update smoke expectations only if the source semantics explicitly change"
  ],
  "scope": {
    "allowed": [
      "docs/diagnostics source-plan packet",
      "readiness semantics design",
      "test expectation impact map",
      "next safe source-change prompt"
    ],
    "blocked": [
      "source code mutation without an explicit plan",
      "model download",
      "model-weight mount",
      "provider call",
      "tool call",
      "worker execution",
      "route execution",
      "media processing",
      "Docker build",
      "Docker push",
      "Docker run",
      "GCP or Cloud Run",
      "Supabase",
      "SQL",
      "artifact creation",
      "real-user media beta unlock",
      "paid production unlock"
    ]
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

Use this prompt after the policy packet is merged. It should prepare the exact source/test change before any readiness semantics code is edited.
