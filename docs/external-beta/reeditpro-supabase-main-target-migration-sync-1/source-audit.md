# RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1 Source Audit

Decision: `completed_reeditpro_main_supabase_target_migration_history_sync`

Execution: `completed_guarded_main_staging_migration_apply_and_readonly_validation`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Active DB URL secret alias: `REEDITPRO_STAGING_SUPABASE_DB_URL`

Access-token secret alias: `SUPABASE_ACCESS_TOKEN`

Source base: `7fc216c101d74b68ae175830ab5fa34b3e956d33`

## Source Chain

- PR #1102 made `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging` the single active Supabase target.
- `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm` is historical sandbox evidence only and was not used as an active target.
- The remote-only main-target migration `20260626163138` is now source-mapped in `supabase/migrations/20260626163138_public_production_edit_session_brief_qwen_gates.sql`.
- The source-mapped remote migration name is `public_production_edit_session_brief_qwen_gates`.
- The source-mapped remote migration creator recorded by Supabase history was `yuzastudio6@gmail.com`.
- The source-mapped remote migration statement SHA-256 was `1e21925ef1dcdbcc7dba2bed22de275df26a76ce05b42e7dca90c6b186498357`.
- The source-mapped remote migration created or altered Edit Brief, marker/cue, project edit-session, idempotency, observability, and Qwen marker-chat metadata surfaces already present on the main target.
- PR #577 remains open/draft/blocked/conflicting and excluded as source-of-truth.

## One-Project Rule

The active beta Supabase project is now the main `Reeditpro` staging project only: `wmyyttnynmteqgcdishd`.

No schema or data was copied from `fajinbvwhcjnutkaumkm` into `wmyyttnynmteqgcdishd`. The sync used committed repository migrations plus the source-mapped remote-only main-target migration history entry.

## Pre-Sync Finding

Before source mapping, `supabase db push --dry-run` failed because remote migration `20260626163138` existed in the main target but not in repository source.

After source mapping, `supabase db push --dry-run --include-all` accepted the migration chain and listed the expected 18 pending repo migrations.

## Safety

This packet records a guarded staging migration apply and read-only validation. It did not execute workers, routes, providers, models, tools, media processing, browser capture, signed URL creation, public artifact creation, Stripe, beta unlock, production unlock, final render/export, or broad service-role handlers.
