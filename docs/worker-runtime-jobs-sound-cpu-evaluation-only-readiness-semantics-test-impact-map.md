# WORKER_RUNTIME_JOBS SOUND CPU Evaluation-Only Readiness Semantics Test Impact Map

```json worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-test-impact-map
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_plan_after_policy_completed_with_warnings_ready_for_source_change_no_runtime",
  "testImpact": [
    {
      "path": "server/smoke/production-readiness-validation-smoke.ts",
      "currentExpectation": "Revideo must have a hard blocker in static readiness.",
      "futureExpectation": "Revideo must remain evaluation_only and execution-blocked, but should not require a static hard blocker solely for non-launch-core evaluation-only status.",
      "updateRequiredInFutureSourceChange": true
    },
    {
      "path": "server/smoke/production-tool-registry-smoke.ts",
      "currentExpectation": "Evaluation-only tools throw for assertToolAllowedForProduction; Revideo is evaluation-only and non-launch-core.",
      "futureExpectation": "No change expected except optionally clarifying that production execution remains blocked separately from static readiness hard-block accounting.",
      "updateRequiredInFutureSourceChange": false
    },
    {
      "path": "scripts/validation/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation-diagnostics.mjs",
      "currentExpectation": "Readiness blocker counts and evaluation-only statuses are frozen from prior packet evidence.",
      "futureExpectation": "If source semantics change adjusts hard-blocker count, dependent diagnostics must be updated additively with new source evidence rather than rewriting historical packets.",
      "updateRequiredInFutureSourceChange": true
    },
    {
      "path": "scripts/validation/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck-diagnostics.mjs",
      "currentExpectation": "Evaluation-only policy routing remains source evidence.",
      "futureExpectation": "Historical decision remains valid; future diagnostics should consume it as source evidence and avoid duplicate model/GPU lanes.",
      "updateRequiredInFutureSourceChange": false
    },
    {
      "path": "server/cli/production-readiness-summary.ts",
      "currentExpectation": "Printed hard blocker count includes static evaluation-only blockers.",
      "futureExpectation": "Printed hard blocker count must reflect rerun source semantics; no exact count should be assumed before the source change reruns.",
      "updateRequiredInFutureSourceChange": false
    }
  ],
  "validationPlanForFutureSourceChange": [
    "run production readiness smoke",
    "run production tool registry smoke",
    "run prod readiness summary",
    "run prod beta summary",
    "run evaluation-only source-change diagnostics",
    "run upstream policy/routing diagnostics",
    "run lint, server typecheck, npx tsc -b, build, and build:server if dependencies are available"
  ],
  "forbiddenTestShortcuts": [
    "do not change tests to claim Revideo execution readiness",
    "do not remove evaluation_only status visibility",
    "do not lower model-weight blockers for whisper_cpp or transparent_background",
    "do not unlock real-user media beta or paid production"
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

The future source-change gate should let the actual readiness rerun determine final counts. This packet records the expected direction without inventing a count.
