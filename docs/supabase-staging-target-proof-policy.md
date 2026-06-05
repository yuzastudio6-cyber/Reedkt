# Supabase Staging Target Proof Policy

Phase: `supabase-staging-target-proof-deploy-rerun`

This phase adds a non-secret proof gate before the PR #206 plugin-assisted registry schema deploy can run. A connected Supabase project name or project ref is safe metadata, but it is not approval by itself.

## Required Proof

Passing proof requires all of:

- a repo-safe approved staging project reference,
- plugin target metadata matching that approved reference,
- no production or ambiguous target signal,
- no DB URL, access token, service-role key, anon key, password, signed URL, or secret payload printed or committed.

Current approved-reference baseline:

- approved staging target reference: `approved`
- plugin observed target: `Reeditpro` / `wmyyttnynmteqgcdishd`
- staging decision: `blocked`
- blockers: `supabase_plugin_target_not_confirmed_as_staging` until the PR #209 proof confirmations and deploy/verify gates pass

## Safe Reference Format

The approved target loader looks only for a committed non-secret approval marker, not for runtime env vars or plugin observations. The approved marker now lives in `docs/supabase-approved-staging-target-reference.md`.

The approval marker must be reviewed before use and must not include DB URLs, keys, tokens, passwords, signed URLs, or raw Supabase output. A passing approved reference does not authorize staging deploy, verification SQL, Track B backfill writes, production use, beta, or public output by itself.

## Forbidden Actions

- staging deploy before target proof passes,
- verification SQL before target proof passes,
- Track B backfill/write,
- production Supabase or production SQL,
- direct/manual SQL deploy,
- provider calls,
- route/tool/worker execution,
- media processing,
- public output,
- beta or production unlock,
- Track A work.

## Next

Rerun the PR #209 staging target proof wrapper with its own target-check, deploy, and verify confirmations. If proof passes and schema deploy/verify passes, rerun the guarded PR #198 Track B staging backfill in a separate phase.
