# Supabase Milestone Registry Staging Deploy Rerun

This phase wraps the existing PR #206 plugin-assisted deploy/verify path. It does not add a new deploy strategy and does not run ad hoc SQL.

## Rerun Flow

1. Load the approved staging target reference from repo-safe metadata.
2. Compare the approved reference with the connected plugin target.
3. Stop if the target is missing, ambiguous, or production-like.
4. If proof passes, delegate only to the PR #206 migration-safe path for `202606050001_activation_milestone_registry_schema_rls.sql`.
5. Verify schema/RLS only after the deploy path passes and verification confirmation is present.
6. Rerun PR #198 preflight/diff only as safe metadata; do not write Track B rows in this phase.

## Current Result

The current repo does not contain an approved staging project reference. The rerun stays blocked with:

- `approved_staging_target_reference_missing`
- `supabase_plugin_target_not_confirmed_as_staging`

## Boundaries

This phase does not deploy seeds, Track B export rows, unrelated migrations, production SQL, manual SQL, provider calls, route/tool/worker execution, media, beta, production, or Track A.
