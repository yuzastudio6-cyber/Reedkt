# SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1

Status: `completed_isolated_clean_staging_target_creation_source_aligned_secret_rotation`

Patch type: guarded isolated non-production Supabase target creation and migration-history readback.

Base source: integration head `b4fb7bfba080e611631706df9840ceeb3766296e`, after merged PR #1078.

## Decision

SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1 decision: completed_isolated_clean_staging_target_creation_source_aligned_secret_rotation

execution: completed_guarded_isolated_target_creation_migration_history_readback_and_db_url_secret_rotation_no_sql_mutation

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION=true`

Target project name: `reeditpro-clean-staging-isolated-v1`

Target project class: `new_isolated_non_production_supabase_target`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`

Remote Supabase command class: `completed_project_list_org_list_project_create_and_migration_history_readback`

Secret Manager payload access: `true_guarded_SUPABASE_ACCESS_TOKEN_and_DB_URL_secret_rotation`

SQL execution: `read_only_migration_history_inspection`

SQL mutation: `none`

Migration dry-run: `not_run`

Migration deployed: `no`

Migration history manual edit: `no`

Supabase db pull: `false`

Branch creation: `not_run`

Branch cleanup/delete: `not_run`

Branch reset: `false`

DB URL secret rotation: `completed_after_source_aligned_migration_history_readback`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Execution Result

Run ID: `2026-06-26T19-56-42-471Z-36bd38cd`

Target action: `created`

Selected project ref: `fajinbvwhcjnutkaumkm`

Selected project region: `us-west-1`

Selected project status: `ACTIVE_HEALTHY`

Migration history readback: `completed_source_aligned_no_remote_only_migrations`

Remote-only migration IDs: `none`

Pending local migration IDs: `202605130001`, `202605130002`, `202605130003`, `202605130004`, `202605130005`, `202605130006`, `202605130007`, `202605130008`, `202605180001`, `202605180002`, `202605180003`, `202605180004`, `202605180005`, `202605180006`, `202605180007`, `202605180008`, `202605190001`, `202605190002`, `202605200001`, `202605200002`, `202605210001`, `202606050001`, `202606180001`, `20260625031135`

DB URL secret rotation: `completed`

Target secret version after run: `projects/390722338345/secrets/REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL/versions/2`

Sanitized report: `docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_report.json`

Sanitized report SHA-256: `c183322d6aba29a52e3cd7f7f7e01681a895e4323dc71f426b2b2946b3d79899`

Sanitized manifest: `docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_manifest.json`

Sanitized manifest SHA-256: `11bd54e8c04c1744f7eafad4c2c2b086b10d81dd93e3d9fa1aa322ca4a8f16e1`

The runner accessed `SUPABASE_ACCESS_TOKEN` through Secret Manager and added a new `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` version only after read-only migration history showed no remote-only migrations. The sanitized report does not include database URLs, passwords, tokens, Supabase URLs, service-role keys, or secret payload values.

## Execution Contract

The guarded runner `supabase-clean-staging-isolated-target-creation-1` may execute only when `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION=true` is present.

When confirmed, it may:

- access `SUPABASE_ACCESS_TOKEN` through Secret Manager without printing or committing the payload;
- list Supabase projects and organizations to resolve the non-production organization and region;
- create the isolated target `reeditpro-clean-staging-isolated-v1` if no exact project with that name exists;
- run `supabase migration list --db-url [redacted]` as read-only migration-history inspection;
- add a new `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` Secret Manager version only if the created target has no remote-only migration history;
- write sanitized report and manifest evidence under `docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/`.

It must not:

- apply migrations;
- run migration dry-run;
- edit migration history;
- run `supabase db pull`;
- create storage objects;
- run service-role routes;
- dispatch workers;
- run providers or models;
- unlock internal beta, external beta, production, or final delivery;
- commit database URLs, passwords, tokens, Supabase URLs, or secret payload values.

## Source Chain

- PR #1078 / `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1` approved a future explicitly gated `new_isolated_non_production_supabase_target` path.
- PR #1074 kept replacement remote-only migration `20260626163138` unmapped.
- PR #1070 created replacement branch candidate `reeditpro-clean-staging-v2` / `rjenorvzqsxwljvvvtxd`, but did not rotate the DB URL secret.
- PR #1064 rejected migration repair, db pull, direct SQL mutation, and migration apply on the current clean branch while `20260626162800` remains unmapped.
- PR #577 remains open/draft/blocked/conflicting and excluded as source-of-truth.

## Readiness

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_isolated_target_migration_chain_apply`

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_source_aligned_clean_staging_target_and_migration_chain_apply`

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_transactional_contract`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_isolated_target_migration_chain_apply`

EXTERNAL-PRODUCT-BETA readiness: `blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates`

## Next Milestones

If the guarded run succeeds:

- `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1`
- `SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1`

If the guarded run blocks, keep the exact blocker from the report and do not rotate DB URL secrets unless source-aligned migration history was proven.

## No-Scope Statement

No SQL mutation, migration dry-run, migration apply, migration history manual edit, Supabase db pull, branch create/delete/reset, RLS policy apply, storage bucket metadata upsert, storage object creation, storage object read, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
