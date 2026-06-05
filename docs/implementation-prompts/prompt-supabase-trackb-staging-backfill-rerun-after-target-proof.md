# Prompt: Supabase Track B Staging Backfill Rerun After Target Proof

Use this prompt only after the Supabase staging target proof and milestone registry schema/RLS deploy verification have passed.

## Preconditions

- `approved_staging_target_reference_missing` is resolved by a committed non-secret staging target reference.
- `supabase_plugin_target_not_confirmed_as_staging` is resolved by matching plugin target proof.
- The registry migration `202606050001_activation_milestone_registry_schema_rls.sql` is verified in staging.
- PR #198 preflight and diff pass without schema/RLS blockers.

## Allowed Future Scope

- Run PR #198 guarded Track B staging metadata backfill only.
- Write safe Track B milestone metadata rows only.
- Use staging Supabase only.

## Forbidden

- production Supabase,
- direct/manual SQL,
- schema mutation,
- providers,
- route/tool/worker execution,
- media processing,
- public output,
- beta or production unlock,
- Track A.

## Required Future Confirmations

Use the PR #198 backfill confirmations only in the future backfill phase. Do not set them during target-proof or schema-deploy phases.
