# RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1

Use after `RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1` records `completed_staging_remote_only_migration_history_source_alignment` and dry-run shows only `20260628000100_qwen2_5_vl_backend_runtime_persistence.sql` pending.

## Goal

Apply the active QWEN runtime persistence migration to the approved Reeditpro staging Supabase target, then run read-only schema validation.

## Required Gate

The execution packet must name target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`, retrieve credentials only from approved Secret Manager entries without printing payloads, and rerun `supabase db push --db-url [redacted] --dry-run` immediately before apply.

## Allowed Remote Mutation

Only this migration apply is in scope:

- `20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`

## Boundary

Do not run provider/model calls, QWEN runtime, workers, routes, media processing, signed/public artifact creation, package installs, deployment, broad external beta unlock, production, or final export. Stop if dry-run shows anything other than the single QWEN migration.
