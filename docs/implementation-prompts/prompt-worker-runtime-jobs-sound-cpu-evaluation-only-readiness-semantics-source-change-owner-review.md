# WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-READINESS-SEMANTICS-SOURCE-CHANGE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_change_after_plan_completed_with_warnings_ready_for_owner_review_no_runtime",
  "goal": "Review the bounded evaluation-only readiness semantics source change before any further beta-readiness blocker reduction.",
  "sourceHeadAtPromptCreation": "2ba78d7c9477394195b359ebbf1672fd9051cb30",
  "reviewRequired": [
    "confirm Revideo remains evaluation-only and execution-blocked",
    "confirm Revideo no longer hard-blocks static readiness solely for evaluation-only status",
    "confirm whisper_cpp and transparent_background remain hard-blocked by model-weight review",
    "confirm real-user media beta and paid production remain blocked",
    "confirm no duplicate model/GPU/provider/media lane was touched"
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
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Use this prompt after the source-change PR is merged. It should review evidence; it should not open runtime execution.
