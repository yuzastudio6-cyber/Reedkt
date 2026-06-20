# REEDITPRO E2E Validation Queue 3 PR Results Register

Queue 3 attempted dependency hydration for PR #255 and PR #260 only. Static diagnostics, lint, typecheck, builds, and readiness summaries were not run for those candidates because dependency hydration did not complete.

```json reeditpro-e2e-validation-queue-3-pr-results-register
{
  "decision": "reeditpro_e2e_validation_queue_3_blocked_validation_failures",
  "hydrationCommand": "npm ci --ignore-scripts --no-audit --no-fund",
  "runtimeNodeOverride": {
    "reason": "default node executable returned Bad CPU type in executable",
    "nodePathUsed": "/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
    "nodeVersion": "v24.14.0",
    "npmVersion": "11.6.2"
  },
  "records": [
    {
      "prNumber": 255,
      "title": "[ai-tools] GD-8A creative graphics resvg runtime fixes",
      "headRefOid": "0ff9bc185176e9195ecc16d95398553ee06f2002",
      "baseRefOid": "9ce9af859cf5ad3a11133720abbd413c1f24b7d4",
      "liveStateAtSelection": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "hydrationResult": "blocked_dependency_hydration_timeout_after_manual_termination",
      "validationResult": "not_run_hydration_failed",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_timeout_blocked",
      "packageJsonStatus": "unchanged",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "partial_install_removed",
      "safetyScanResult": "passed_after_partial_artifact_cleanup",
      "commandsRun": [
        "npm ci --ignore-scripts --no-audit --no-fund",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsNotRunBecauseHydrationBlocked": [
        "npm run ai-tools:creative-graphics:resvg-runtime:diagnostics",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server"
      ]
    },
    {
      "prNumber": 260,
      "title": "[ai-tools] GD-7 retry creative graphics controlled local fixture execution",
      "headRefOid": "c20c2e5cc0a9cf66bebcdcc14989663f58eae68b",
      "baseRefOid": "0ff9bc185176e9195ecc16d95398553ee06f2002",
      "liveStateAtSelection": "OPEN",
      "draft": false,
      "mergeable": "MERGEABLE",
      "mergeStateStatus": "CLEAN",
      "hydrationResult": "blocked_dependency_hydration_timeout_300s",
      "validationResult": "not_run_hydration_failed",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_timeout_blocked",
      "baseLineageNote": "PR #260 depends on PR #255, which did not validate in queue 3.",
      "packageJsonStatus": "unchanged",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "partial_install_removed",
      "safetyScanResult": "passed_after_partial_artifact_cleanup",
      "commandsRun": [
        "npm ci --ignore-scripts --no-audit --no-fund",
        "git diff --check",
        "git diff --cached --check"
      ],
      "commandsNotRunBecauseHydrationBlocked": [
        "npm run ai-tools:creative-graphics:gd7-retry-local-execution:diagnostics",
        "npm run lint",
        "npm run typecheck:server",
        "npx tsc -b",
        "npm run prod:readiness:summary",
        "npm run prod:beta:summary",
        "npm run build",
        "npm run build:server"
      ]
    }
  ],
  "mergeReadyAfterValidation": [],
  "blockedAfterValidation": [255, 260],
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
