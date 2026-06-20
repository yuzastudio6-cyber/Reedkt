# REEDITPRO-E2E-VALIDATION-QUEUE-2 Hydration Fix PR Results Register

The queue-2 hydration-fix pass ran one bounded safe hydration attempt per selected candidate. It did not retry PR #305 hydration.

```json reeditpro-e2e-validation-queue-2-hydration-fix-pr-results-register
{
  "decision": "reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4",
  "safeHydrationCommand": "npm ci --ignore-scripts --no-audit --no-fund",
  "records": [
    {
      "prNumber": 245,
      "headRefOid": "bce1c0283b41ea5e3ca653617e1bafb7176ad563",
      "baseRefOid": "dd9da65835cc79bd7ab79f5601402e25d3c1751d",
      "hydrationResult": "passed",
      "validationResult": "passed_with_inherited_readiness_blockers",
      "diffCheckResult": "passed",
      "mergeReadinessRecommendation": "ready_for_merge_hygiene",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "removed_after_validation"
    },
    {
      "prNumber": 263,
      "headRefOid": "163a90669d87bc605f1e72e4e1903a9526f9778c",
      "baseRefOid": "3c0ab2383108c2b3bde904a58285cb7cfa69a067",
      "hydrationResult": "passed",
      "validationResult": "passed_with_inherited_readiness_blockers",
      "diffCheckResult": "passed",
      "mergeReadinessRecommendation": "ready_for_merge_hygiene",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "removed_after_validation"
    },
    {
      "prNumber": 264,
      "headRefOid": "905977ce42172dbd3b196dec68009535c812087b",
      "baseRefOid": "163a90669d87bc605f1e72e4e1903a9526f9778c",
      "hydrationResult": "passed",
      "validationResult": "blocked_after_validation",
      "diffCheckResult": "failed_git_diff_check_whitespace",
      "mergeReadinessRecommendation": "not_ready_whitespace_blocked",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "removed_after_validation"
    },
    {
      "prNumber": 300,
      "headRefOid": "3a3f02e2dcb02a51c205711416f266ff0bdcf34e",
      "baseRefOid": "f06172a50924e630f0e909914d45d5e6c7a41396",
      "hydrationResult": "blocked_enospc",
      "validationResult": "not_run_hydration_failed",
      "diffCheckResult": "not_run_hydration_failed",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_enospc_blocked",
      "packageLockStatus": "unchanged_before_disposable_cleanup",
      "nodeModulesStatus": "partial_install_removed_after_enospc"
    }
  ],
  "mergeReadyAfterValidation": [245, 263],
  "blockedAfterFix": [264, 300],
  "safetyScanResult": "passed_no_secret_shaped_markers",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
