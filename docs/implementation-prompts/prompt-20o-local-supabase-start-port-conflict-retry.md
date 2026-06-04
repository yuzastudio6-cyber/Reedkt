# Prompt 20O Local Supabase Start Port Conflict Retry

## Summary

Prompt 20O retries local-only Supabase start after Prompt 20N by routing around the local DB and Studio port conflict caused by `rapportd`.

- Branch: `codex/rp-foundation-20o-local-supabase-start-port-conflict-retry`
- Base: `origin/codex/rp-foundation-20n-local-supabase-migration-chain-repair-follow-up-7`
- PR title: `[foundation] Prompt 20O local Supabase start port conflict retry`
- Exact production capability enabled: `none; local-only Supabase start retry`

## Allowed Scope

- Change local-only Supabase config ports when implementation-time port inspection confirms conflicts.
- Run local safety probes, local preflight, `supabase stop --no-backup`, and `supabase start`.
- Run `supabase status` only if local start succeeds.
- Record only localhost-safe DB evidence if start succeeds.
- Update validation, evidence, blocker, and tracker documents.

## Forbidden Scope

- No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, `supabase db reset`, SQL/RLS smoke tests, raw `psql`, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, schema-changing production migration, dependency mutation, production/beta unlock, or broad service-role handler.
- No non-Supabase process is killed. Prompt 20O routes around `rapportd` instead of terminating it.

## Deliverables

- Update `supabase/config.toml`:
  - `[db].port`: `54322` -> `54330`
  - `[studio].port`: `54323` -> `54331`
- Add `docs/prompt-20o-local-supabase-start-port-conflict-retry.md`.
- Update local Supabase evidence, blocker, scorecard, source map, milestone, production status, and implementation prompt trackers.
- Add Foundation Validation PR trigger coverage for `codex/rp-foundation-20n-local-supabase-migration-chain-repair-follow-up-7`.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20n-local-supabase-migration-chain-repair-follow-up-7...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `supabase stop --no-backup`
- `supabase start`
- `supabase status` only if start passes
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Result

Prompt 20O resolves the `54322`/`54323` local port conflict by moving the local DB and Studio ports to `54330` and `54331`. Local `supabase start` advances through the Prompt 20N repaired RLS migration and then fails at `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql` with `SQLSTATE 42501` because the migration attempts to comment on `storage.buckets` without table ownership.

No localhost DB URL was captured, no SQL/RLS smoke test ran, and no staging/remote/production Supabase target was touched.

Recommended next prompt: Prompt 20P - Local Supabase Migration Chain Repair Follow-Up 8.
