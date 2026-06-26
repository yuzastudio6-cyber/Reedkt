# Activation Results: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1

Decision: `completed_worker_runtime_transactional_rpc_isolated_target_readback`

Execution: `completed_guarded_readonly_worker_rpc_catalog_readback_no_runtime_execution`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_TRANSACTIONAL_RPC_ISOLATED_TARGET_READBACK=true`

Target project: `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `2` / `enabled`

Remote command class: `psql readonly worker_runtime catalog query [db-url redacted]`

Secret Manager payload access: `true_guarded_isolated_target_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

SQL execution: `read_only_worker_runtime_catalog_sql`

SQL mutation: `none`

RPC execution: `false`

Service-role route execution: `false`

Worker execution: `false`

Worker dispatch: `false`

Worker lease claim: `false`

Storage object creation: `false`

Storage object read: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Schema/function/table readback:

- worker runtime schema present: `true`
- service-role schema usage: `true`
- anon/authenticated/public schema usage blocked: `true`
- missing functions: `none`
- non-security-definer functions: `none`
- functions missing service-role execute: `none`
- functions executable by anon/authenticated/public: `none`
- missing tables: `none`
- tables missing RLS: `none`
- tables missing service-role DML: `none`
- tables selectable by anon/authenticated/public: `none`

Run ID: `2026-06-26T20-27-24-319Z-d8696635`

Sanitized report SHA-256: `a6548f0ef96d84686c75d89b30586a04c2dc3125b5e85552cad65a2ddb07cad5`

Sanitized manifest SHA-256: `bb92f1f91c07599365e5519e223012d364e50209f0658bdb44458e429d930c21`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Validation: `full_validation_passed_after_guarded_worker_rpc_readback`

Validation commands passed:

- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent supabase-worker-runtime:transactional-rpc-isolated-target-readback-1:diagnostics`
- `npm run --silent supabase-clean-staging-isolated-target-migration-chain-apply-1:diagnostics`
- `npm run --silent supabase-clean-staging-isolated-target-creation-1:diagnostics`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- Non-executing changed-file and staged safety scans.

Next milestone: `SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1`

No Supabase mutation, SQL mutation, RPC execution, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, storage object creation, storage object read, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
