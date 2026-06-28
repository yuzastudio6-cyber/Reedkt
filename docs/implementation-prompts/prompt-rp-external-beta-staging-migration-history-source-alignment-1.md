# RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1

Use after `RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1` records `blocked_remote_staging_migration_history_requires_source_alignment_before_qwen_apply`.

## Goal

Source-align the approved Reeditpro staging migration history before retrying QWEN runtime persistence staging migration validation.

## Required Inputs

- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Remote-only migration versions to reconcile:
  - `202606270001` / `tool_cost_metering_events`
  - `202606270002` / `beta_readiness_evidence_packets`
  - `202606270003` / `tool_cost_wallet_settlement_rpc`
- Active QWEN migration waiting for staging validation:
  - `supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`

## Boundary

Do not apply QWEN or any new migration until the three remote-only versions are source-aligned or explicitly reconciled by a source-derived packet. Do not repair migration history, run `supabase db pull`, apply SQL, edit migration history, access production, run providers/models/workers/media, create signed/public artifacts, or unlock external beta/production/final export unless a later packet explicitly authorizes the exact target and operation.

## Expected Outcome

Either:

- commit source-aligned migration files for the three remote-only versions and prove `supabase db push --db-url [redacted] --dry-run` reaches only the QWEN pending migration; or
- record an exact blocker and leave QWEN staging migration validation blocked.
