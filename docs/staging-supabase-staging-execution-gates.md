# Staging Supabase Staging Execution Gates

Prompt 23 defines gates for Prompt 24. It does not execute staging SQL, remote SQL, local SQL, migrations, or Supabase lifecycle commands.

## Required Prompt 24 Gates

Prompt 24 may proceed only when all gates are true:

| Gate | Required state |
| --- | --- |
| Human decision | `approved_for_guarded_staging_validation` from Prompt 23. |
| Staging target | Confirmed disposable staging project, not production. |
| Staging reference | Redacted and recorded outside committed secrets. |
| Confirmation variables | Current-shell values present for RLS validation, SQL execution, migration validation, synthetic fixtures, cleanup, and rollback acceptance. |
| Fixture namespace | Synthetic, deterministic, cleanupable, and workspace/project isolated. |
| Cleanup owner | Available and recorded in redacted form. |
| Rollback owner | Available and recorded in redacted form. |
| Evidence policy | Redacted evidence only; no secrets, signed URLs, or full connection strings. |
| Approved test set | Only the Prompt 23 approved path. |

## Confirmation Variables

Prompt 24 must require:

- `REEDITPRO_CONFIRM_STAGING_SUPABASE_RLS_VALIDATION=true`
- `REEDITPRO_CONFIRM_STAGING_SUPABASE_SQL_EXECUTION=true`
- `REEDITPRO_CONFIRM_STAGING_SUPABASE_MIGRATION_VALIDATION=true`
- `REEDITPRO_CONFIRM_STAGING_SUPABASE_SYNTHETIC_FIXTURES=true`
- `REEDITPRO_CONFIRM_STAGING_SUPABASE_CLEANUP=true`
- `REEDITPRO_CONFIRM_STAGING_SUPABASE_ROLLBACK_ACCEPTANCE=true`

Do not set production, broad runtime, provider, worker, render, storage-transfer, credit, Stripe, or beta confirmation variables for this path.

## Stop Conditions

Prompt 24 must stop if:

- the target cannot be proven staging-only;
- any migration fails;
- the approved RLS path fails;
- cleanup cannot be verified;
- an unapproved SQL file would run;
- a secret, token, signed URL, or full connection string appears;
- any provider, tool, worker, render, media, storage transfer, credit, Stripe, telemetry, deployment, beta, or production side effect appears.

## Evidence Requirements

Prompt 24 may commit only safe summaries:

- approved decision record reference;
- redacted staging target classification;
- approved test set;
- sanitized command outcomes;
- sanitized SQLSTATE or migration failure summaries;
- fixture namespace and row counts in aggregate;
- cleanup/rollback status.

Prompt 24 must not commit secrets, full connection strings, private URLs, raw auth tokens, or staging credentials.
