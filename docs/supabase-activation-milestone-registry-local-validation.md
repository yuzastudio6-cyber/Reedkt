# Supabase Activation Milestone Registry Local Validation

Local validation uses committed schema metadata and static SQL checks.

Run only with the local validation confirmation:

```bash
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_LOCAL_VALIDATE=true npm run activation:supabase-milestone-registry-schema:local-validate
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_LOCAL_VALIDATE=true npm run activation:supabase-milestone-registry-schema:rls-test
```

Local artifacts:

- `supabase/seed/activation_milestone_registry_seed.sql`
- `database/test-sql/021_activation_milestone_registry_rls_tests.sql`
- `docs/activation-supabase-milestone-registry-schema-reports/`

The seed is local-only and contains one passed fixture milestone, one blocked fixture milestone, readiness metadata, blocker metadata, PR evidence, and artifact manifest metadata. It must not be used as a staging or production data backfill.
