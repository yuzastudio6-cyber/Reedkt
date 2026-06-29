# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECHECK-AFTER-SIGNALSMITH-BOUNDED-RECONCILIATION

```json worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_signalsmith_bounded_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_readiness_recheck_no_media_no_production",
  "goal": "Recheck launch-core readiness after Signalsmith bounded activation evidence is reflected as a static warning.",
  "expectedInputs": {
    "tool": "signalsmith_stretch",
    "expectedDryRunStatus": "warning",
    "expectedSourceHeadAtOrAfter": "7b29183038dce33326f8c964b50ed66f61e2fd3e",
    "expectedEvidenceScope": "bounded_activation_evidence_only"
  },
  "requiredChecks": [
    "npm run worker-runtime-jobs:sound-cpu-signalsmith-bounded-readiness-reconciliation:diagnostics",
    "npm run prod:readiness:summary",
    "npm run prod:beta:summary",
    "git diff --check",
    "git diff --cached --check"
  ],
  "scope": {
    "allowed": [
      "readiness summary recheck",
      "duplicate PR review",
      "blocker count reporting"
    ],
    "blocked": [
      "Signalsmith runtime rerun",
      "Signalsmith persistent install claim",
      "tool execution",
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
      "beta or production unlock"
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

Use this prompt only after the reconciliation packet is merged. The recheck should confirm the blocker-count delta and then identify the next real beta blocker without reopening Signalsmith execution.
