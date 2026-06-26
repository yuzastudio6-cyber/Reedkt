# Activation Results: SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1

Decision: `completed_isolated_clean_staging_target_creation_source_aligned_secret_rotation`

Execution: `completed_guarded_isolated_target_creation_migration_history_readback_and_db_url_secret_rotation_no_sql_mutation`

Confirmation gate: `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION=true`

Target project name: `reeditpro-clean-staging-isolated-v1`

Target project class: `new_isolated_non_production_supabase_target`

Target DB URL secret: `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`

Remote Supabase command class: `completed_project_list_org_list_project_create_and_migration_history_readback`

Secret Manager payload access: `true_guarded_SUPABASE_ACCESS_TOKEN_and_DB_URL_secret_rotation`

SQL execution: `read_only_migration_history_inspection`

SQL mutation: `none`

Migration dry-run: `not_run`

Migration deployed: `no`

Migration history manual edit: `no`

Supabase db pull: `false`

Branch creation: `not_run`

Branch cleanup/delete: `not_run`

DB URL secret rotation: `completed_after_source_aligned_migration_history_readback`

Run ID: `2026-06-26T19-56-42-471Z-36bd38cd`

Selected project ref: `fajinbvwhcjnutkaumkm`

Selected project status: `ACTIVE_HEALTHY`

Migration history readback: `completed_source_aligned_no_remote_only_migrations`

Remote-only migration IDs: `none`

Target secret version after run: `projects/390722338345/secrets/REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL/versions/2`

Sanitized report SHA-256: `c183322d6aba29a52e3cd7f7f7e01681a895e4323dc71f426b2b2946b3d79899`

Sanitized manifest SHA-256: `11bd54e8c04c1744f7eafad4c2c2b086b10d81dd93e3d9fa1aa322ca4a8f16e1`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Internal beta unlocked: `false`

External beta unlocked: `false`

Production unlocked: `false`

Validation: `full_validation_passed_after_guarded_isolated_target_creation`

Validation commands passed:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent supabase-clean-staging-isolated-target-creation-1:diagnostics`
- `npm run --silent supabase-clean-staging-isolated-target-owner-decision-1:diagnostics`
- `npm run --silent supabase-clean-staging-branch-replacement-history-source-mapping-1:diagnostics`
- `npm run --silent supabase-clean-staging-branch-replacement-execution-1:diagnostics`
- `npm run --silent rp-external-product-beta-current-readiness-rollup-1:diagnostics`
- non-executing changed-file and staged safety scans

No SQL mutation, migration dry-run, migration apply, migration history manual edit, Supabase db pull, branch create/delete/reset, RLS policy apply, storage bucket metadata upsert, storage object creation, storage object read, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
