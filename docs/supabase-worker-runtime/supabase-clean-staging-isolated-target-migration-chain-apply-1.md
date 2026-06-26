# SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1

Status: `completed_isolated_target_migration_chain_apply_and_readback`

Patch type: guarded isolated clean staging target migration-chain apply with sanitized readback evidence.

Base source: integration head `135f9a150a4648bdc439cd01a9c843ef5333ee0c`, after merged PR #1087.

## Decision

SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1 decision: `completed_isolated_target_migration_chain_apply_and_readback`

Execution: `completed_guarded_isolated_target_migration_chain_apply_readback_no_beta_unlock`

Blocker: `none`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_MIGRATION_CHAIN_APPLY=true`

Confirmation observed: `present_true`

Target project: `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`

Target class: `new_isolated_non_production_supabase_target`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `2` / `enabled`

Secret Manager payload access: `true_guarded_isolated_target_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

Remote Supabase command classes:

- `supabase migration list --db-url [redacted]`
- `supabase db push --dry-run --db-url [redacted]`
- `supabase db push --db-url [redacted]`
- `psql readonly catalog query against public/storage metadata [db-url redacted]`

SQL execution: `migration_apply_and_readonly_catalog_sql`

SQL mutation: `migration_apply_only`

Migration dry-run: `passed`

Migration deployed: `yes`

Migration history manual edit: `no`

Migration history updated by Supabase CLI apply: `true`

RLS policy apply by migration: `true`

Storage bucket metadata upsert by migration: `true`

Storage object creation: `false`

Storage object read: `false`

Storage bucket metadata read: `true`

Service-role route execution: `false`

Worker execution: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Migration Result

The isolated target had source-aligned remote history before apply:

- remote-only migration IDs before apply: `none`
- pending local migrations before apply: `24`

The guarded runner then completed the Supabase CLI dry-run and applied the repository migration chain to the isolated non-production target.

Required migration readback after apply:

- `202606050001`: `present`
- `202606180001`: `present`
- `20260625031135`: `present`

Missing required migration IDs after apply: `none`

## Schema / RLS / Storage Readback

Read-only catalog/storage metadata readback passed after migration apply.

- Missing expected tables: `none`
- Tables missing RLS: `none`
- Missing private buckets: `none`
- Public private buckets: `none`

The readback did not read storage objects, create storage objects, execute service-role routes, dispatch workers, or unlock beta.

## Evidence

Run ID: `2026-06-26T20-17-17-711Z-6032e557`

Sanitized report: `docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_report.json`

Report checksum: `19c849a2223cedf8caaaf447299d15d7b77979e5dc400e9a27a62b3df0db3f2f`

Sanitized manifest: `docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_manifest.json`

Manifest checksum: `596c1fa2775c63374fdb9ee3e06d852302d99cc413bae6369d08d80b0e8384c5`

Credential payload values are not recorded, hashed, summarized, printed, or committed.

## Readiness

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `ready_for_isolated_target_worker_rpc_readback`

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_worker_rpc_readback_and_service_role_runtime_validation`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_worker_rpc_readback_service_role_runtime_private_storage_and_runtime_gates`

EXTERNAL-PRODUCT-BETA readiness: `blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates`

## Next Milestone

`SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1`

The next packet may run only guarded readback/validation for the worker runtime transactional RPC surfaces on the isolated target. It must not dispatch workers, execute service-role routes, process media, create signed/public artifacts, or unlock beta unless a later explicit runtime gate approves those operations.

## #577 Exclusion

PR #577 remains open/draft/blocked and excluded as source-of-truth for this Supabase internal-beta lane.

## No-Scope Statement

No migration history manual edit, Supabase db pull, storage object creation, storage object read, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Secret Manager payload access was limited to guarded isolated target database URL retrieval for Supabase CLI migration dry-run/apply and read-only catalog/storage metadata readback; the payload was not printed, persisted, hashed, summarized, or committed.
