# Supabase Staging Schema Deploy After Approved Target Reference

Phase: `supabase-staging-schema-deploy-after-target-reference`

This phase reruns the guarded staging schema deploy/verify path after the approved staging target reference from PR #212.

Approved non-secret target metadata:

- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment: `staging`

Allowed scope:

- Confirm the connected Supabase target matches the approved staging reference.
- Deploy only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` through a migration-safe workflow.
- Verify activation milestone registry schema/RLS metadata.
- Rerun PR #198 Track B backfill preflight/diff/report only.

Blocked scope:

- Track B backfill writes.
- Production Supabase or production SQL.
- Direct/manual ad hoc SQL deploy.
- Seed data, Track B export rows, unrelated migrations, provider calls, route/tool/worker execution, media processing, public output, beta/production unlock, and Track A.

Required current-shell confirmations before any staging schema mutation:

```bash
REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF=true
REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY=true
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY=true
REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION=true
```

If staging credentials, target proof, Supabase CLI/plugin migration-safe apply, dry-run, or verification are unavailable, the correct outcome is a blocker report. Do not attempt manual SQL repair in this phase.
