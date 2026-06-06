# Supabase RLS No-Policy Rollback Cleanup Plan

Prompt 26E drafts rollback and cleanup requirements for a future RLS no-policy migration. It does not create or run rollback SQL.

## Status

- Rollback cleanup plan status: `rls_no_policy_rollback_cleanup_planned`.
- Rollback executed: no.
- SQL executed: none.
- Migration deployed: no.
- Supabase environment touched: none.

## Future Rollback Model

- Every future policy migration must list each policy name from the naming contract and its matching rollback action.
- Rollback should remove only the policies created by that future migration.
- Rollback must not drop tables, truncate data, alter production data, change grants broadly, or disable RLS on exposed-schema tables without separate review.
- If a future migration introduces helper dependencies, rollback must not drop helper functions unless that exact prompt created them and proves no other dependency exists.

## Future Cleanup Model

- Synthetic test rows must be scoped to a deterministic prompt/test identifier.
- Cleanup must remove synthetic activation, readiness, feature, and tool rows only.
- Cleanup evidence must show no private media, signed URLs, provider data, Stripe data, or production-like records were used.
- Staging cleanup must have a named human/operator owner before execution.

## Evidence Required For Future Rollback

| Evidence | Requirement |
| --- | --- |
| Policy list before migration | Redacted policy inventory showing the six tables before changes. |
| Policy list after migration | Redacted policy inventory showing only approved future policies were added. |
| Rollback command packet | Reviewed command packet with placeholders only before execution. |
| Cleanup proof | Redacted output proving synthetic rows were removed or rollback transaction completed. |
| Reviewer signoff | Human reviewer confirms staging rollback completeness before any production candidate. |

## Production Rule

No production rollback or production migration may occur from this plan. Production rollback requires separate production approval, accepted staging evidence, and a production-specific command packet.
## Prompt 26E-1 local candidate rollback note

If the Prompt 26E-1 local candidate must be backed out before a future staging-reviewed migration, remove the candidate migration from the branch or apply an approved local rollback that drops only the candidate policies:

```sql
-- Local review rollback sketch only; do not run outside an approved local prompt.
drop policy if exists activation_artifacts_select_backend_only on public.activation_artifacts;
drop policy if exists activation_artifacts_insert_backend_only on public.activation_artifacts;
drop policy if exists activation_artifacts_update_backend_only on public.activation_artifacts;
drop policy if exists activation_artifacts_delete_backend_only on public.activation_artifacts;
```

The real rollback list must include all 24 Prompt 26E-1 policies and must stay scoped to the six advisor tables. No row cleanup is required because `002_rls_no_policy_advisor_tables_local.sql` is catalog-only and rolls back without fixture inserts.
