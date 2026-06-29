# WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-CHANGE-AFTER-PLAN

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-after-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime",
  "goal": "Implement the bounded readiness semantics source change that separates evaluation-only static visibility from production execution authorization.",
  "sourceHeadAtPromptCreation": "c5b07c6301fda299306576e44db71669dcc4ea77",
  "targetTools": [
    "whisper_cpp",
    "transparent_background",
    "revideo"
  ],
  "requiredSourceChanges": [
    "remove evaluation_only as an independent blocksProductionIfMissing condition in production-tool-readiness specs",
    "preserve model-weight and license blockers for evaluation-only tools that still require review",
    "preserve evaluation_only status visibility in production readiness summaries",
    "preserve runtime execution denial in tool-runtime-policy",
    "change Revideo static readiness assertion from production-blocked to evaluation-only non-launch-core execution-blocked",
    "update smoke expectations to assert execution denial without requiring Revideo to be a static hard blocker"
  ],
  "blockedScope": [
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
  ],
  "validationRequired": [
    "source-change diagnostics",
    "production readiness smoke",
    "production tool registry smoke",
    "prod readiness summary",
    "prod beta summary",
    "upstream evaluation-only policy diagnostics",
    "cross-chat ownership diagnostics",
    "lint",
    "server typecheck",
    "npx tsc -b",
    "build",
    "build:server",
    "git diff checks",
    "safety scan"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Use this prompt only after the source-plan packet is merged. The source change must be small, test-backed, and must not enable execution.
