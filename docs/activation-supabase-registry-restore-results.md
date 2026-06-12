# SUPABASE-REGISTRY-1 Activation Milestone Registry Staging Restoration Results

Status: `proof_only_completed`

Branch: `codex/rp-supabase-registry-1-activation-milestone-registry-staging-restoration`

Base: `codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference`

Run ID: `registry1-20260612T135915`

## Execution

- Proof-only mode: `true`
- SQL executed: `false`
- Migration deployed: `false`
- Supabase rows written: `false`
- GCS uploaded: `false`

## Approved Staging Target

- Project label: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment: `staging`

## Registry Tables

- `activation_runs`: missing_or_not_checked
- `activation_artifacts`: missing_or_not_checked
- `activation_qa_gates`: missing_or_not_checked
- `readiness_snapshots`: missing_or_not_checked
- `tool_capabilities`: missing_or_not_checked
- `feature_gates`: missing_or_not_checked

## Migration Status

- Migration file: `supabase/migrations/202606040001_activation_milestone_registry.sql`
- Static migration safety: `passed`
- Migration history status: `not_attempted`
- Migration history present: `not_checked`

## RLS And Security

- RLS enabled on all tables: `false`
- Unsafe public/anon/authenticated access: `false`
- Service-role access on all tables: `false`
- Secret payloads printed: `false`

## PostgREST Visibility

- Status: `not_attempted`
- Service-role REST used: `false`
- All tables visible: `false`

## Provider-1 Unblock Status

- Status: `blocked`
- Can rerun Provider-1 milestone sync: `false`
- Next owner: `SUPABASE_RLS_STORAGE_DATABASE`

## Artifacts

- None. Proof-only mode does not upload GCS artifacts.

## QA

- QA status: `blocked`
- Blockers: `blocked_pending_supabase_registry_restore_confirmation`, `provider1_unblock_status`

## Blocked Features

- `production`
- `external_beta`
- `broad_media`
- `unrelated_sql`
- `schema_reset`
- `rls_weakening`
- `unrelated_row_writes`
- `provider_calls`
- `worker_tool_model_execution`
- `public_artifacts`

## Human Action Required

Set `REEDITPRO_CONFIRM_SUPABASE_REGISTRY_RESTORE=true` and `REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL=true` in a fresh shell before running guarded staging SQL restore.
