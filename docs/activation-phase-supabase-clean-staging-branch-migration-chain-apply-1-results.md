# Activation Results: SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1

Decision: `blocked_clean_branch_remote_migration_history_has_untracked_versions`

Execution: `blocked_before_migration_apply_no_sql_mutation`

Blocker: `blocked_clean_branch_remote_migration_history_has_untracked_versions`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd`

Clean branch: `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_MIGRATION_CHAIN_APPLY=true`

Confirmation observed: `present_true`

Clean branch DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `1` / `enabled`

Supabase access-token secret metadata: `SUPABASE_ACCESS_TOKEN` version `5` / `enabled`

Secret Manager payload access: `true_guarded_clean_branch_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

Remote Supabase command classes: `supabase migration list --db-url [redacted]`, `supabase db push --dry-run --db-url [redacted]`

Dry-run status: `blocked`

Migration deployed: `no`

SQL execution: `none`

SQL mutation: `none`

Migration history manual edit: `no`

Storage object creation: `false`

Storage object read: `false`

Service-role route execution: `false`

Production touched: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Evidence

Run ID: `2026-06-26T18-32-12-934Z-5959eece`

Sanitized report: `docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json`

Report checksum: `2f46073bf7933ba1affb7059828511c25a4971af314a1465574de98e0cad8883`

Sanitized manifest: `docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json`

Manifest checksum: `5fca0a1a246b45df2947472b13305929b4e9602f4c38bcf52b63ffd46f47b091`

Remote-only migration versions blocking dry-run: `20260610235210`, `20260626162800`.

Pending local migrations remain unapplied, including required current migrations `202606050001`, `202606180001`, and `20260625031135`.

## Next Step

Next milestone: `SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1`

That milestone must decide how to reconcile the clean branch remote-only history before any retry. This packet does not approve `supabase migration repair`, `supabase db pull`, direct SQL, migration apply, branch reset, branch recreation, storage object access, service-role route execution, or beta unlock.

## No-Scope Statement

No Supabase migration apply, SQL mutation, migration history manual edit, RLS policy apply, storage bucket metadata upsert, storage object creation, storage object read, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Secret Manager payload access was limited to guarded clean branch database URL retrieval for migration history readback and Supabase CLI dry-run; the payload was not printed, persisted, hashed, summarized, or committed.
