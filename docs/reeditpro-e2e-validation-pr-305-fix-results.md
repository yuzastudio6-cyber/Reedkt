# REEDITPRO-E2E-VALIDATION-PR-305-FIX Results

Decision: `pr_305_validation_blocked_npm_ci_failed`

This validation-fix pass re-ran PR #305 dependency hydration in a fresh isolated worktree. The blocker reproduced: `npm ci` remained active without completing and was interrupted with exit code `130`. PR #305 cannot move to the merge queue from this evidence.

```json reeditpro-e2e-validation-pr-305-fix-results
{
  "decision": "pr_305_validation_blocked_npm_ci_failed",
  "generatedAt": "2026-06-18T18:55:03Z",
  "repository": "yuzastudio6-cyber/Reedkt",
  "sourceQueuePr": {
    "number": 523,
    "title": "[e2e] Validation queue batch 1",
    "state": "OPEN",
    "draft": true,
    "mergeable": "MERGEABLE",
    "mergeStateStatus": "CLEAN",
    "headRefOid": "549978e4478392d1dc65bf17b891cb01600a4821",
    "baseRefOid": "61dc4940340db9508012f74294fd6723accb3d36",
    "decision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures"
  },
  "targetPr": {
    "number": 305,
    "title": "[track-a] Group B creative graphics handoff review",
    "state": "OPEN",
    "draft": false,
    "mergeable": "MERGEABLE",
    "mergeStateStatus": "CLEAN",
    "headRefName": "codex/rp-tracka-gd-groupb-handoff-0-review",
    "headRefOid": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
    "baseRefName": "codex/rp-gd-10-group-b-controlled-local-fixture-execution",
    "baseRefOid": "f39cd11bbbf7b256141d9e8fd4f82ce5df69acca",
    "changedFiles": 23,
    "comments": 0,
    "reviews": 0,
    "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
    "bodyDecision": "tracka_groupb_handoff_ready_with_warnings",
    "bodyNextPrompt": "TRACKA-GD-GROUPB-HANDOFF-1 - Private Preview Composition Plan for Group B Creative Graphics Fixtures"
  },
  "validationWorktree": {
    "path": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix",
    "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
    "trackedPreflightClean": true,
    "sidecarsRemoved": true,
    "nodeVersion": "v26.3.0",
    "npmVersion": "11.16.0",
    "packageLock": "present",
    "nodeModulesBeforeHydration": "missing",
    "toolBinariesBeforeHydration": {
      "tsx": "missing",
      "eslint": "missing",
      "tsc": "missing",
      "vite": "missing"
    }
  },
  "hydrationRetry": {
    "command": "npm ci",
    "allowedPurpose": "local validation hydration only",
    "result": "blocked",
    "exitCode": 130,
    "classification": "pr_305_validation_blocked_npm_ci_failed",
    "observedBehavior": "node_modules populated partially, npm ci remained active without completing, and an orphan npm ci process required an additional interrupt.",
    "packageLockStatus": "unchanged",
    "packageJsonStatus": "unchanged",
    "nodeModulesAfterInterruptedHydration": "present_unstaged_disposable_only",
    "toolBinariesAfterInterruptedHydration": {
      "tsx": "missing",
      "eslint": "missing",
      "tsc": "missing",
      "vite": "missing"
    }
  },
  "commandsRun": [
    {"command": "node --version", "result": "passed", "output": "v26.3.0"},
    {"command": "npm --version", "result": "passed", "output": "11.16.0"},
    {"command": "npm ci", "result": "blocked", "exitCode": 130},
    {"command": "git diff --check", "result": "passed"},
    {
      "command": "git diff --check origin/codex/rp-gd-10-group-b-controlled-local-fixture-execution...HEAD",
      "result": "passed"
    },
    {"command": "git diff --cached --check", "result": "passed"},
    {"command": "safety scan over PR #305 changed files and final worktree state", "result": "passed"}
  ],
  "commandsNotRunBecauseHydrationBlocked": [
    "npm run lint",
    "npm run typecheck:server",
    "npm run foundation:validate",
    "npm run --silent tracka:creative-graphics:group-b-handoff:diagnostics",
    "npm run --silent ai-tools:creative-graphics:group-b-local-fixtures:diagnostics",
    "npm run --silent ai-tools:creative-graphics:group-b-runtime-gate:diagnostics",
    "npm run --silent ai-tools:creative-graphics:package-runtime:diagnostics",
    "npm run --silent internal-beta:cross-workstream-gate:diagnostics",
    "npm run prod:readiness:summary",
    "npm run prod:beta:summary",
    "npm run build",
    "npm run build:server",
    "npm run foundation:validate:with-build"
  ],
  "safetyScan": {
    "result": "passed",
    "filesScanned": 23,
    "stagedFiles": false,
    "packageFilesChanged": false,
    "secretsFound": false,
    "supabaseUrlsFound": false,
    "signedPublicArtifactUrlsFound": false,
    "unsafeRuntimeTrueFlagsFound": false,
    "readinessWideningFound": false,
    "mediaRuntimeClaimsFound": false,
    "betaProductionUnlockClaimsFound": false
  },
  "mergeQueueDecision": {
    "canMovePr305ToMergeQueue": false,
    "reason": "Dependency hydration did not complete, so dependency-backed validation did not run."
  },
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "nextPrompt": "REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
