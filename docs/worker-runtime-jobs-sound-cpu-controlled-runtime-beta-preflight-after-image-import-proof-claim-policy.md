# WORKER_RUNTIME_JOBS SOUND CPU Controlled Runtime Beta Preflight Claim Policy

```json worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-claim-policy",
  "allowedClaims": [
    "container_import_blocker_cleared",
    "dependency_hydration_blocked_by_disk_risk",
    "beta_preflight_requires_cleanup_before_retry"
  ],
  "forbiddenClaims": [
    "product_tool_call_execution_ready",
    "worker_execution_ready",
    "route_execution_ready",
    "runtime_readiness",
    "media_readiness",
    "generated_local_fixture_passed",
    "dry_run_passed",
    "external_beta_ready",
    "production_ready"
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
