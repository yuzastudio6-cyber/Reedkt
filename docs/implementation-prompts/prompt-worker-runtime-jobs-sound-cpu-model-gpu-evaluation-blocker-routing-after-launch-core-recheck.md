# WORKER_RUNTIME_JOBS-SOUND-CPU-MODEL-GPU-EVALUATION-BLOCKER-ROUTING-AFTER-LAUNCH-CORE-RECHECK

```json worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_readiness_recheck_after_signalsmith_bounded_reconciliation_completed_with_warnings_ready_for_model_gpu_evaluation_blocker_routing_no_runtime",
  "goal": "Route the remaining model-weight, GPU, evaluation-only, and real-user-media blockers without duplicating adjacent owner lanes.",
  "sourceHeadAtCreation": "29602c9203d663768525585edd5d7b153a0db8e1",
  "requiredInputs": {
    "hardBlockers": 63,
    "warnings": 26,
    "toolStatusCounts": {
      "warning": 14,
      "not_installed": 13,
      "future_only": 7,
      "evaluation_only": 3,
      "needs_license_review": 2,
      "needs_model_weight_review": 10
    },
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "requiredDuplicateReview": [
    "inspect open QWEN backend/runtime persistence PRs",
    "inspect open AI video/model-weight PRs",
    "inspect GPU/model-weight owner evidence lanes",
    "do not create a duplicate closure packet when an existing lane owns the blocker"
  ],
  "scope": {
    "allowed": [
      "read-only blocker routing",
      "docs/diagnostics owner packet",
      "existing-lane evidence comparison",
      "next safe prompt selection"
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

Use this only after the launch-core recheck packet is merged. The prompt should decide whether the next blocker belongs to an existing owner chat lane or needs a new narrow routing packet.
