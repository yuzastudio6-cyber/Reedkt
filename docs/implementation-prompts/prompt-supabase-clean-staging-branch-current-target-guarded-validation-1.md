# SUPABASE-CLEAN-STAGING-BRANCH-CURRENT-TARGET-GUARDED-VALIDATION-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-DB-URL-SECRET-HANDOFF-1`.

## Required Target

Target: `Reeditpro` / `wmyyttnynmteqgcdishd`

Clean branch: `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`

Credential aliases:

- `SUPABASE_ACCESS_TOKEN`
- `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`

## Required Gate

Any remote validation packet must require an explicit confirmation variable and must fail closed without it. The packet may read the approved secret payloads only as ephemeral process inputs. It must not print, persist, hash, summarize, or commit credential payload values.

## Allowed Future Validation Scope

- Verify the clean branch identity.
- Run migration history readback against the clean branch.
- Run schema/RLS readback against the clean branch.
- Run storage/RLS validation that does not create buckets or read objects unless a later storage-specific gate approves it.
- Record sanitized reports and checksums.

## Blocked Scope

No production mutation, divergent parent staging mutation, migration history table edit, public artifacts, signed URL source-of-truth, worker/provider execution, beta unlock, final render/export, or broad service-role route is approved by this prompt.
