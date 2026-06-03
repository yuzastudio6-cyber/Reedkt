# Prompt 20K Local Supabase Migration Chain Repair Follow-Up 4

## Summary

Implement Prompt 20K in a clean sibling worktree at `/Volumes/backup/codex-worktrees/reeditpro-prompt20k-local-supabase-migration-chain-repair-follow-up-4`, based on `origin/codex/rp-foundation-20j-local-supabase-migration-chain-repair-follow-up-3`.

- Branch: `codex/rp-foundation-20k-local-supabase-migration-chain-repair-follow-up-4`
- PR base: `codex/rp-foundation-20j-local-supabase-migration-chain-repair-follow-up-3`
- PR title: `[foundation] Prompt 20K local Supabase migration chain repair follow-up 4`
- Exact capability enabled: `none; local-only migration chain repair`

## Required Scope

- Patch only `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`.
- Add nullable compatibility columns for missing schema-era credit/snapshot references.
- Guard approved snapshot foreign key creation with table, column, and scoped constraint checks.
- Guard `idx_credit_estimates_project_plan` with table/column/index checks.
- Do not backfill approved snapshot IDs from legacy credit approval or edit plan records.
- Do not rename tables, drop data, reorder migrations, rewrite migration history broadly, or add unrelated schema changes.
- If `supabase start` reaches a new blocker, record the exact migration/error and stop.

## Forbidden Scope

Do not run or enable staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, deployment, beta/production unlock, dependency mutation, or broad service-role handlers.

Do not run SQL/RLS smoke tests in Prompt 20K.

## Validation Checklist

Use PATH:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

Run:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20j-local-supabase-migration-chain-repair-follow-up-3...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`

If preflight reports `remoteRiskDetected=false` and `canStartLocalSupabase=true`, run:

- `supabase stop --no-backup`
- `supabase start`

If `supabase start` passes, run `supabase status` and record only localhost-safe host, port, database name, and local-only yes/no. Run only non-SQL list/dry-run checks if useful.

If `supabase start` fails, record the exact migration, SQLSTATE, failing statement, and next blocker. Do not run `supabase status`, `psql`, or SQL/RLS tests.

## Acceptance Criteria

- `202605180004_reeditpro_credits_approval_snapshots.sql` no longer fails on missing `public.credit_reservations.approved_plan_snapshot_id`.
- Approved snapshot FKs are guarded.
- `idx_credit_estimates_project_plan` is guarded.
- Validation results are honest and distinguish local migration-chain progress from RLS test execution.
- No remote/staging/production Supabase target is touched.
- PR is pushed/opened, and the tracker receives the PR link in a follow-up commit.
