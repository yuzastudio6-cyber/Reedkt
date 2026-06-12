# Supabase Staging Owner Data-Loss Acceptance

staging_reset_data_loss_acceptance_status: approved
approved_staging_environment: staging

Approval status: `owner_data_loss_acceptance_approved`

Accepted by role: `staging_owner_or_product_owner`

Approved target:
- Environment: `staging`
- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`

The staging owner/product owner accepts that a future staging reset/reapply phase may delete or overwrite staging database state for the approved staging target only.

Accepted scope:
- staging only
- production excluded
- no production SQL
- no Track B backfill in the reset phase
- no provider/tool/worker/route execution
- backup/snapshot/export plan must be followed if required by PR #252
- dry-run or preview must run first when available
- post-reset schema/RLS verification is required
- Track B staging backfill remains a separate later phase

Secret values included: `false`

This artifact does not run staging reset, migration repair, schema deploy, direct DDL/DML, Track B backfill, production Supabase, provider calls, tools/workers/routes, media processing, Track A, beta, or production unlocks.
