# Activation Results: SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1

Decision: `completed_isolated_target_migration_chain_apply_and_readback`

Execution: `completed_guarded_isolated_target_migration_chain_apply_readback_no_beta_unlock`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_MIGRATION_CHAIN_APPLY=true`

Target project: `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `2` / `enabled`

Remote Supabase command classes:

- `supabase migration list --db-url [redacted]`
- `supabase db push --dry-run --db-url [redacted]`
- `supabase db push --db-url [redacted]`
- `psql readonly catalog query against public/storage metadata [db-url redacted]`

Secret Manager payload access: `true_guarded_isolated_target_db_url_only`

Credential payload printed: `false`

Credential payload persisted in repo: `false`

SQL execution: `migration_apply_and_readonly_catalog_sql`

SQL mutation: `migration_apply_only`

Migration dry-run: `passed`

Migration deployed: `yes`

Migration history manual edit: `no`

Storage object creation: `false`

Storage object read: `false`

Storage bucket metadata read: `true`

Service-role route execution: `false`

Worker execution: `false`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Run ID: `2026-06-26T20-17-17-711Z-6032e557`

Before apply remote-only migration IDs: `none`

Before apply pending local migration count: `24`

After apply missing required migration IDs: `none`

Required migrations present:

- `202606050001`
- `202606180001`
- `20260625031135`

Schema/RLS/storage readback:

- Missing expected tables: `none`
- Tables missing RLS: `none`
- Missing private buckets: `none`
- Public private buckets: `none`

Sanitized report SHA-256: `19c849a2223cedf8caaaf447299d15d7b77979e5dc400e9a27a62b3df0db3f2f`

Sanitized manifest SHA-256: `596c1fa2775c63374fdb9ee3e06d852302d99cc413bae6369d08d80b0e8384c5`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Validation: `full_validation_passed_after_guarded_isolated_target_migration_chain_apply`

Validation commands passed:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent supabase-clean-staging-isolated-target-migration-chain-apply-1:diagnostics`
- `npm run --silent supabase-clean-staging-isolated-target-creation-1:diagnostics`
- `npm run --silent supabase-clean-staging-isolated-target-owner-decision-1:diagnostics`
- `npm run --silent supabase-clean-staging-branch-replacement-history-source-mapping-1:diagnostics`
- `npm run --silent supabase-clean-staging-branch-replacement-execution-1:diagnostics`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Next milestone: `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-ISOLATED-TARGET-READBACK-1`

No migration history manual edit, Supabase db pull, storage object creation, storage object read, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
