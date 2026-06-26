# SUPABASE-CLEAN-STAGING-BRANCH-DB-URL-SECRET-HANDOFF-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-EXECUTION-CURRENT-TARGET-REVALIDATION-1`.

## Required Secret Alias

Create or populate this Secret Manager secret with the clean branch database URL for `reeditpro-internal-staging-clean` / `fnjiylwirntrqdcwpbho`:

`REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`

The payload must remain secret. Do not print it, commit it, copy it into docs, hash it, or summarize it.

## Boundary

This handoff authorizes only credential-context completion for a future guarded validation packet. It does not authorize SQL execution, migration apply, migration history edits, storage object reads, service-role routes, worker execution, public artifacts, internal beta unlock, external beta unlock, production, or final delivery/export.

After the alias exists, run a separate guarded packet that names the clean target, requires an explicit confirmation gate, validates payload presence without printing it, and records sanitized readback evidence.
