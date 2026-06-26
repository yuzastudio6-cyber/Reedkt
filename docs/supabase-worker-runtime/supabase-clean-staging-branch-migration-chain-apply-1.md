# SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1

Status: `blocked_clean_branch_remote_migration_history_has_untracked_versions`

Patch type: guarded clean staging branch migration-chain apply attempt with sanitized evidence.

Base source: integration head `e4e39d9e64f6637fc394af14c76d839b11061de3`, after merged PR #1048.

## Decision

SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1 decision: blocked_clean_branch_remote_migration_history_has_untracked_versions

execution: blocked_before_migration_apply_no_sql_mutation

Blocker: `blocked_clean_branch_remote_migration_history_has_untracked_versions`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_MIGRATION_CHAIN_APPLY=true`

Confirmation observed: `present_true`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd`

Clean branch: `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`

Clean branch DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `1` / `enabled`

Supabase access-token secret metadata: `SUPABASE_ACCESS_TOKEN` version `5` / `enabled`

Secret Manager payload access: `true_guarded_clean_branch_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

Remote Supabase command classes:

- `supabase migration list --db-url [redacted]`
- `supabase db push --dry-run --db-url [redacted]`

SQL execution: `none`

SQL mutation: `none`

Migration dry-run: `blocked`

Migration deployed: `no`

Migration history manual edit: `no`

Migration history updated by Supabase CLI apply: `false`

RLS policy apply by migration: `false`

Storage bucket metadata upsert by migration: `false`

Storage object creation: `false`

Storage object read: `false`

Storage bucket metadata read: `false`

Service-role route execution: `false`

Worker execution: `false`

Production touched: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Dry-Run Result

The guarded runner reached the clean branch target, read migration history, and attempted the Supabase CLI dry-run only. The dry-run failed before any migration apply because the remote migration history contains versions that do not exist in the local migration directory.

Untracked remote migration versions:

- `20260610235210`
- `20260626162800`

The first untracked version has prior clean-branch source evidence as a plugin-generated equivalent of the committed activation registry migration `202606050001_activation_milestone_registry_schema_rls.sql`. The second untracked version is present in the live clean branch migration history but is not represented by a local migration file in this repository source. Because that history is not source-aligned, this packet did not run `supabase migration repair`, `supabase db pull`, direct SQL, or migration apply.

Pending local migrations still not applied to the clean branch:

- `202605130007`
- `202605130008`
- `202605180001`
- `202605180002`
- `202605180003`
- `202605180004`
- `202605180005`
- `202605180006`
- `202605180007`
- `202605180008`
- `202605190001`
- `202605190002`
- `202605200001`
- `202605200002`
- `202605210001`
- `202606050001`
- `202606180001`
- `20260625031135`

Required current migrations remain missing by committed local version:

- `202606050001`
- `202606180001`
- `20260625031135`

## Evidence

Run ID: `2026-06-26T18-32-12-934Z-5959eece`

Sanitized report: `docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json`

Report checksum: `2f46073bf7933ba1affb7059828511c25a4971af314a1465574de98e0cad8883`

Sanitized manifest: `docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json`

Manifest checksum: `5fca0a1a246b45df2947472b13305929b4e9602f4c38bcf52b63ffd46f47b091`

Credential payload values are not recorded, hashed, summarized, printed, or committed.

## Readiness

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: `blocked_pending_clean_staging_migration_history_reconciliation`

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: `blocked_pending_clean_staging_migration_history_reconciliation`

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_transactional_contract`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_clean_staging_migration_history_reconciliation`

EXTERNAL-PRODUCT-BETA readiness: `blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates`

## Next Milestone

`SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1`

The next packet must decide how to reconcile the clean branch remote-only versions before any migration-chain apply is retried. It must not run `supabase migration repair`, `supabase db pull`, direct SQL, branch reset, branch recreation, or migration apply unless a later explicitly confirmed execution packet approves the exact target and operation.

## No-Scope Statement

No Supabase migration apply, SQL mutation, migration history manual edit, RLS policy apply, storage bucket metadata upsert, storage object creation, storage object read, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Secret Manager payload access was limited to guarded clean branch database URL retrieval for migration history readback and Supabase CLI dry-run; the payload was not printed, persisted, hashed, summarized, or committed.
