# WORKER_RUNTIME_JOBS SOUND CPU Controlled Runtime Beta Preflight Validation Register

```json worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-validation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_passed_with_warnings_ready_for_runtime_execution_approval_gate",
  "cleanupEvidence": {
    "baselineBackupFreeGiBApprox": 1.8,
    "postCleanupFreeGiBApprox": 29,
    "cleanInactiveWorktreesRemoved": 14,
    "sidecarsRemovedFromPreflightWorktree": 7013,
    "wholeWorktreeDeletionWasLastResort": true,
    "dirtyMainCheckoutTouched": false,
    "npmCacheCleaned": false,
    "privateTmpValidationDirsRemoved": false
  },
  "dependencyHydration": {
    "command": "npm ci --no-audit --no-fund",
    "passed": true,
    "durationApprox": "8m",
    "mode": "validation_only",
    "packageLockUnchanged": true,
    "packageLockSha256": "bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3",
    "nodeModulesIgnoredAndUnstaged": true,
    "allowScriptsWarnings": [
      "esbuild@0.28.0",
      "fsevents@2.3.3"
    ],
    "allowScriptsChanged": false
  },
  "commands": [
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-runtime-beta-blocker-resolution:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-product-beta-readiness-gap-closure:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-runtime-execution-gap-closure-plan-review:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-worker-dispatch-contract-schema-owner-review:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-dispatch-signoff-collection-closure-owner-review:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run worker-runtime-jobs:sound-cpu-owner-evidence-lane-gap-closure-review:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run cross-chat-tool-ownership:diagnostics",
      "status": "passed"
    },
    {
      "command": "npm run prod:readiness:summary",
      "status": "passed_blocked_report",
      "overallStatus": "blocked"
    },
    {
      "command": "npm run prod:beta:summary",
      "status": "passed_internal_testing_summary",
      "externalBetaAllowed": false
    },
    {
      "command": "npm run lint",
      "status": "passed"
    },
    {
      "command": "npm run typecheck:server",
      "status": "passed"
    },
    {
      "command": "npx tsc -b",
      "status": "passed"
    },
    {
      "command": "npm run build",
      "status": "passed"
    },
    {
      "command": "npm run build:server",
      "status": "passed"
    }
  ],
  "summary": {
    "dependencyHydrationReadyToday": true,
    "dependencyBackedStaticChecksPassed": true,
    "runtimeExecutionAllowed": false,
    "externalBetaAllowed": false,
    "productionAllowed": false
  }
}
```
