# Supabase Activation Milestone Registry Staging Deployment

Staging schema deployment is guarded and uses the Supabase migration workflow only. Do not use SQL editor/manual direct SQL for this phase.

Required current-shell confirmations for a future guarded staging deploy:

```bash
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true
```

Required before deploy:

- Redacted staging project reference.
- Server-side staging credentials only.
- Local migration/RLS validation passed.
- No Track B backfill confirmations set.
- No production Supabase target.
- No service-role or database credential values printed or committed.

If staging credentials or toolchain are unavailable, the phase must stop and report `staging_supabase_credentials_unavailable` or the exact toolchain blocker.
