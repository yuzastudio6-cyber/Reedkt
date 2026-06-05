# Supabase Activation Milestone Registry Rollback

Rollback scope is schema-only unless a future guarded staging deploy actually runs.

Rollback acceptance:

- No Track B data rows are written in this schema phase.
- If a future staging deploy fails, use Supabase migration rollback or a reviewed revert migration against staging only.
- Do not drop unrelated tables.
- Do not mutate production.
- Do not delete Track B rows in this phase.
- Record redacted rollback evidence before any production-promotion approval.

Backfill cleanup remains a separate PR #198 follow-up concern after the schema/RLS deployment has been verified.
