# Supabase Track B Backfill Rollback Plan

Rollback applies only to staging rows written by this Track B metadata backfill.

Rollback rules:

- Target rows by the backfill `phase_id` and `run_id` set.
- Do not drop tables or mutate schema.
- Do not delete unrelated activation registry rows.
- Do not touch production.
- Record redacted cleanup evidence before any promotion approval.

No rollback is required for the committed reports on the PR #196 base because staging write is blocked until registry schema/RLS evidence exists.
