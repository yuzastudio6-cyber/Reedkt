# Prompt 20J Local Supabase Migration Chain Repair Follow-Up 3

## Summary

Implement Prompt 20J in a clean sibling worktree from `origin/codex/rp-foundation-20i-local-supabase-migration-chain-repair-follow-up-2`, using branch `codex/rp-foundation-20j-local-supabase-migration-chain-repair-follow-up-3`.

PR title: `[foundation] Prompt 20J local Supabase migration chain repair follow-up 3`

Exact production capability enabled: `none; local-only Supabase migration chain repair`.

## Required Scope

- Patch only `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`.
- Add safe compatibility columns for the known `public.edit_plan_segments` schema-era conflict.
- Guard FK and index creation so local migration validation can advance without requiring unproven legacy backfills.
- Run local-only safety checks and local `supabase start` only after no remote risk is detected.
- Record the next migration-chain blocker if local start advances and fails later.

## Forbidden Scope

No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, schema-changing production migration, dependency mutation, production/beta unlock, or broad service-role handler is enabled.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20i-local-supabase-migration-chain-repair-follow-up-2...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `supabase stop --no-backup`
- `supabase start`
- `supabase status` only if local start passes
- `npm run supabase:rls:list-tests` and `npm run supabase:rls:local:dry-run` only if local start passes

## Result

Prompt 20J repaired the `public.edit_plan_segments.edit_plan_version_id` migration-chain blocker. Local `supabase start` now passes `202605180003_reeditpro_intent_plan_versions.sql` and advances to the next migration:

- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`

The new blocker:

```text
ERROR: column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)
```

No SQL/RLS smoke test ran. Prompt 20K is recommended.
