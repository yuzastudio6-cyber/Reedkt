# Activation Phase: RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1 Results

Decision: `completed_controlled_external_beta_authenticated_staging_smoke_validation`

Execution: `completed_authenticated_health_readiness_source_status_smoke_only`

External beta readiness: `controlled_external_beta_smoke_validated_authenticated_staging_api`

External beta enabled in this phase: `true`

Cloud Run service: `reeditpro-staging-api`

Region: `us-central1`

Latest ready revision: `reeditpro-staging-api-00005-7gs`

HTTP smoke:

- unauthenticated access: `blocked_403`
- authenticated `/health`: `200`
- authenticated `/ready`: `200`
- authenticated `/api/runtime/status`: `200`
- authenticated `/health/readiness`: `404_deployed_runtime_uses_ready_endpoint`

Runtime mode: `mock`

Mock only: `true`

Provider real calls enabled: `false`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Validation: `full_validation_passed_after_authenticated_staging_smoke`

## Result

The controlled external beta staging API flag application has a passing authenticated health/readiness smoke. Unauthenticated access remains blocked by Cloud Run with `403`, so this is still a controlled private-preview lane and not a public beta/public artifact unlock.

Next safe action: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`.

Observed validation:

- `npm ci --no-audit --no-fund --progress=false`: passed
- `git diff --check`: passed
- `npm run --silent rp-external-beta-controlled-smoke-validation-1:diagnostics`: passed
- `npm run --silent rp-external-beta-staging-flag-application-1r:diagnostics`: passed
- `npm run --silent rp-external-beta-staging-flag-application-1:diagnostics`: passed
- `npm run --silent rp-external-beta-controlled-enablement-1:diagnostics`: passed
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
