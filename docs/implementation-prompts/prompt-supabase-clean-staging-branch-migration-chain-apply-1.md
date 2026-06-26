# SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1

Use this only after `SUPABASE-CLEAN-STAGING-BRANCH-CURRENT-TARGET-GUARDED-VALIDATION-1`.

## Current Blocker

Current decision: `blocked_clean_branch_migration_history_not_current`

Clean branch: `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`

Remote migration history is aligned only through `202605130006`.

Required missing current migrations include:

- `202606050001`
- `202606180001`
- `20260625031135`

## Required Gate

Any migration-chain apply packet must require an explicit confirmation variable and must name the clean branch target. It must read secret payloads only as ephemeral process inputs and must not print, persist, hash, summarize, or commit credential payload values.

## Allowed Future Scope

- Run a dry-run against the clean branch database URL.
- Apply the full reviewed migration chain only to the clean branch if explicitly confirmed.
- Rerun read-only migration history and schema/RLS/storage metadata readback after apply.
- Record sanitized report/manifest/checksums.

## Blocked Scope

No parent staging mutation, no production mutation, no migration history table edit, no service-role route execution, no worker/provider/model execution, no media processing, no public artifacts, no signed URL source-of-truth, no beta unlock, and no final render/export is approved by this prompt.
