# Prompt 20P - Local Supabase Migration Chain Repair Follow-Up 8

## Summary

Prompt 20P repairs the local-only migration-chain blocker in `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`.

Branch: `codex/rp-foundation-20p-local-supabase-migration-chain-repair-follow-up-8`

PR: [PR #158](https://github.com/yuzastudio6-cyber/Reedkt/pull/158)

PR base: `codex/rp-foundation-20o-local-supabase-start-port-conflict-retry`

Exact production capability enabled: `none; local-only storage migration chain repair`.

## Allowed Scope

- Patch only `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`.
- Remove documentation-only `COMMENT ON` statements against Supabase-owned storage objects.
- Preserve removed wording as plain SQL comments.
- Run local-only Supabase safety checks and `supabase start`.
- Record exact local evidence and blockers.

## Forbidden Scope

- No staging Supabase.
- No remote Supabase.
- No production Supabase.
- No `supabase link`.
- No remote SQL.
- No SQL/RLS smoke test execution.
- No provider call.
- No rendering/export.
- No tool execution.
- No worker execution.
- No production job claim.
- No media processing.
- No browser capture.
- No storage transfer.
- No signed URL creation.
- No credit mutation.
- No Stripe checkout/webhook/payment processing.
- No external telemetry.
- No deployment.
- No production/beta unlock.
- No dependency mutation.
- No non-Supabase process termination.
- No broad service-role handler.

## Deliverables

- `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`
- `docs/prompt-20p-local-supabase-migration-chain-repair-follow-up-8.md`
- `docs/implementation-prompts/prompt-20p-local-supabase-migration-chain-repair-follow-up-8.md`
- Updated local Supabase evidence, manifest, scorecard, blocker inventory, status, source map, milestone plan, implementation tracker, and workflow trigger coverage.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20o-local-supabase-start-port-conflict-retry...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `supabase stop --no-backup`
- `supabase start`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- The migration no longer fails on `COMMENT ON TABLE storage.buckets`.
- Removed storage comment wording remains preserved as plain SQL comments and docs.
- Bucket seed/upsert and storage policy creation are not broadened or skipped in this prompt.
- Local start result is recorded honestly.
- No SQL/RLS smoke test runs.
- No staging/remote/production Supabase target is touched.
- Next prompt recommendation is clear.

## Result

Prompt 20P removes the documentation-only `COMMENT ON` storage statements in `202605180008_reeditpro_storage_buckets_policies.sql` and preserves the intent as SQL comments.

Local `supabase start` now passes `202605180008_reeditpro_storage_buckets_policies.sql` and fails later in `202605200001_storage_upload_pipeline_readiness.sql` with `SQLSTATE 42501` on `COMMENT ON POLICY ... ON storage.objects`.

No localhost-only DB URL was captured and no SQL/RLS smoke test ran.

Recommended next prompt: Prompt 20P2 - Storage Ownership/Privilege Follow-Up.
