# Supabase Plugin Staging Target Policy

The plugin target must fail closed unless it is explicitly proven staging.

Project name alone is not sufficient. The active plugin project `Reeditpro` is treated as unknown because it has no staging label in the plugin metadata.

## Accepted Target Proof

The target may be treated as staging only when all are true:

- `REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK=true`
- Plugin or operator metadata identifies the selected project ref.
- `REEDITPRO_SUPABASE_PLUGIN_TARGET_ENV=staging`
- `REEDITPRO_SUPABASE_PLUGIN_EXPECTED_STAGING_PROJECT_REF` matches the selected plugin project ref.
- `REEDITPRO_SUPABASE_PLUGIN_STAGING_TARGET_PROOF=staging_confirmed_by_operator`

These variables are target proof, not secret values. They must not include DB URLs, tokens, service-role keys, anon keys, or connection strings.

## Fail-Closed Blockers

- `supabase_plugin_target_not_confirmed_as_staging`
- `supabase_plugin_project_ref_mismatch`
- `blocked_target_not_staging`

If any blocker is present, schema inspection, deploy, verify, PR #198 backfill rerun, and production promotion remain blocked.
