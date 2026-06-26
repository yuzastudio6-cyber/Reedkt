# SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1`.

## Current Blocker

Current decision: `blocked_clean_branch_remote_migration_history_has_untracked_versions`

Clean branch: `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`

The guarded migration-chain apply runner stopped before apply because `supabase db push --dry-run --db-url [redacted]` found remote migration versions that are not present in `supabase/migrations/`:

- `20260610235210`
- `20260626162800`

## Required Decision

Decide the safe reconciliation path before any migration-chain retry:

- source-map the remote-only versions to committed migration files, if evidence exists;
- or add reviewed source migration files matching the remote history, if source can be safely derived;
- or approve a separate migration-history repair execution only after readback proves schema parity;
- or recreate/replace the clean branch through a separately approved clean-target reset path.

## Blocked Scope

Do not run `supabase migration repair`, `supabase db pull`, direct SQL, migration apply, branch reset, branch recreation, storage object access, service-role route execution, workers, providers, media processing, public artifacts, signed URLs, internal beta unlock, external beta unlock, production unlock, or final render/export inside the reconciliation decision unless a later execution packet explicitly approves that exact operation.
