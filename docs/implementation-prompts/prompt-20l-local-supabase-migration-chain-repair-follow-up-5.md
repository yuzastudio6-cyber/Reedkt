# Prompt 20L Local Supabase Migration Chain Repair Follow-Up 5

## Summary

Prompt 20L repairs the local-only Supabase migration-chain blocker in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`.

Branch: `codex/rp-foundation-20l-local-supabase-migration-chain-repair-follow-up-5`

PR base: `codex/rp-foundation-20k-local-supabase-migration-chain-repair-follow-up-4`

Exact production capability enabled: `none; local-only migration chain repair`.

## Allowed Scope

- Patch only `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`.
- Add additive nullable compatibility columns for local migration-chain validation.
- Guard same-migration foreign key and index assumptions.
- Run local-only toolchain preflight and `supabase start` after no-remote safety gates pass.
- Record exact blocker evidence.

## Forbidden Scope

- No staging Supabase execution.
- No remote Supabase execution.
- No production Supabase execution.
- No `supabase link`.
- No remote SQL or migration deployment.
- No SQL/RLS smoke test execution.
- No provider call.
- No rendering/export.
- No tool execution.
- No worker execution.
- No production job claim.
- No media processing.
- No storage transfer.
- No signed URL creation.
- No credit mutation.
- No Stripe flow.
- No external telemetry.
- No deployment.
- No production/beta unlock.
- No dependency mutation.
- No broad service-role handler.

## Implementation Record

Prompt 20L:

- added `generation_requests.approved_plan_snapshot_id`;
- guarded `generation_requests_approved_plan_snapshot_id_fkey`;
- guarded `idx_generation_requests_project_snapshot`;
- added `generated_asset_versions.version`;
- backfilled `version` from `version_number` where both columns exist;
- guarded `idx_generated_asset_versions_asset_version`;
- added workflow PR-target coverage for the Prompt 20K base branch;
- updated local Supabase evidence and beta blocker trackers.

## Validation Checklist

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20k-local-supabase-migration-chain-repair-follow-up-4...HEAD` | Passed |
| `npm ci` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed with local DB URL still missing |
| `npm run --silent supabase:local:preflight` | Passed; local start allowed, SQL still blocked |
| `supabase stop --no-backup` | Passed |
| `supabase start` | Failed at `202605180006_reeditpro_qa_exports_audit.sql` after passing the Prompt 20L migration |
| `supabase status` | Not run because start failed |
| SQL/RLS runner | Not run |
| `npm run build` | Local environment-blocked by Darwin Rolldown native binding/code-signature issue |
| `npm run build:server` | Local environment-blocked by the same Rolldown issue |
| `npm run foundation:validate:with-build` | Default checks passed; full build classified as local `environment_blocked` |

## Acceptance Criteria

- The Prompt 20K blocker in `202605180005_reeditpro_generation_assets_jobs.sql` is repaired.
- Local `supabase start` advances past the repaired migration.
- Any new migration-chain blocker is recorded exactly without widening scope.
- No SQL/RLS smoke test is run.
- No staging, remote, or production Supabase target is touched.
- No product runtime capability is enabled.

## Next Prompt

Recommended next prompt: Prompt 20M - Local Supabase Migration Chain Repair Follow-Up 6.
