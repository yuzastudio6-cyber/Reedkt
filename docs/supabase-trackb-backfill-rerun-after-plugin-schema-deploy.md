# Supabase Track B Backfill Rerun After Plugin Schema Deploy

After plugin-assisted staging deploy and verification pass, rerun the PR #198 Track B staging backfill as a separate guarded phase.

This phase does not set PR #198 write confirmations and does not write Track B rows.

## Required Before Rerun

- Plugin target preflight confirms staging.
- Schema deploy report status is `passed`.
- Schema verification report status is `passed`.
- RLS verification report status is `passed`.
- PR #198 preflight and diff no longer report registry schema/RLS blockers.

## Still Blocked Until PR #198 Rerun

- Track B staging metadata writes.
- Production Supabase.
- Schema mutation in the backfill phase.
- Provider calls, routes/workers/tools, media processing, beta/production unlock, public output, and Track A.
