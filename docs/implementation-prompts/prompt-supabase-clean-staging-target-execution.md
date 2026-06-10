# Supabase Clean Staging Target Execution

Use this prompt only after reviewing the clean staging approval packet.

## Required Source

- Approval decision: `approved_for_future_clean_supabase_staging_branch`
- Report path: `docs/activation-supabase-clean-staging-target-approval-reports/clean_staging_target_approval_decision.json`
- Recommended target: `clean_supabase_staging_branch`

## Required Behavior

- Confirm Supabase branch availability and cost before creating a clean staging branch.
- Prefer a clean staging branch; use a new staging project only if branch availability or cost blocks the branch path.
- Create or update clean staging secret references without printing payloads.
- Apply local migrations only in the separate execution phase and verify migration history, schema, RLS, and activation milestone registry tables.
- Run PR #198 Track B staging backfill preflight/diff after verification only.
- Keep Track B backfill writes, production, direct SQL, support ticket submission, providers, tools, workers, media, Track A, beta, and production unlocks blocked unless later phases explicitly approve them.

## Forbidden In This Approval Packet

This approval packet did not create a branch/project, run SQL, deploy migrations, repair migration history, write Track B rows, submit a support ticket, or touch production.
