# Staging Supabase Validation Runbook

This runbook is a future validation guide. Prompt 19 does not run these steps.

## A. Static Preflight

1. Confirm the branch and PR match the approved validation milestone.
2. Run `npm ci`.
3. Run `npm run foundation:validate`.
4. Run all diagnostics, including `npm run --silent supabase:rls:prep:diagnostics`.
5. Inspect `docs/supabase-rls-test-manifest.md`.
6. Verify no secrets, signed URLs, provider keys, service-role keys, private media, Stripe keys, or raw credentials are in tracked files.
7. Verify GitHub Foundation Validation is passing.
8. Confirm no SQL/Supabase command has been run in the preparation milestone.

## B. Local Supabase Preflight

These steps are for Prompt 20 or later after explicit local-only approval.

1. Verify the Supabase CLI architecture is compatible with the host, or use the approved Docker/container path.
2. Verify Docker availability if the local Supabase path requires it.
3. Verify the local project is not linked to production or staging.
4. Start local Supabase in a disposable environment.
5. Reset the local database.
6. Apply migrations from the approved branch head.
7. Seed synthetic fixtures according to `docs/supabase-rls-fixture-contract.md`.
8. Run selected executable RLS tests from the manifest.
9. Collect command output, failed cases, fixture IDs, and cleanup output.
10. Clean up fixtures or reset local state.

## C. Staging Supabase Preflight

These steps require human approval and must not run in Prompt 19.

1. Record reviewer approval and staging project identity.
2. Confirm the target is staging, not production.
3. Confirm no production data is present.
4. Confirm backup and rollback plans.
5. Apply migrations to staging only if approved.
6. Seed synthetic data only.
7. Run staging-safe RLS tests only.
8. Collect evidence and Supabase advisor output.
9. Clean up synthetic fixtures.
10. Record failed tests and blocker decisions.
11. Record final go/no-go recommendation.

## D. Prohibited Production Path

- No production SQL.
- No production data.
- No production migration.
- No production secrets.
- No automatic promotion from staging.
- No beta or production unlock from this runbook alone.

## Failure Handling

Any failed migration, failed cleanup, unexpected cross-workspace access, public storage exposure, signed URL persistence, secret-like value, or backend-owned write exposure blocks beta readiness until a follow-up hardening prompt fixes and revalidates the issue.
