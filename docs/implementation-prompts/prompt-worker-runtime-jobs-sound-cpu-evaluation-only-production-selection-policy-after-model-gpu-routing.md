# WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-PRODUCTION-SELECTION-POLICY-AFTER-MODEL-GPU-ROUTING

```json worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime",
  "goal": "Close or route evaluation-only production-readiness blockers for SOUND CPU without executing tools or duplicating model/GPU lanes.",
  "sourceHeadAtCreation": "9341b5ebf75179a50a9c193df163fb72ee66e235",
  "targetTools": [
    "whisper_cpp",
    "transparent_background",
    "revideo"
  ],
  "requiredChecks": [
    "Confirm evaluation-only tools are not required launch-core SOUND CPU execution dependencies unless a later owner gate explicitly promotes them",
    "Confirm fallback or exclusion policy preserves real-user media and production safety",
    "Confirm no active QWEN, AI B-roll, or AI graphics lane is duplicated",
    "Run readiness summaries and diagnostics before any PR"
  ],
  "scope": {
    "allowed": [
      "docs/diagnostics policy packet",
      "readiness accounting review",
      "fallback/exclusion policy planning",
      "next prompt selection"
    ],
    "blocked": [
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

Use this prompt after the routing packet is merged. The aim is to reduce real blockers by deciding the evaluation-only policy path, not by installing or running evaluation-only tools.
