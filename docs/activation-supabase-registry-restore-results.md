# SUPABASE-REGISTRY-1 Activation Milestone Registry Staging Restoration Results

Status: `restore_completed`

Branch: `codex/rp-supabase-registry-1-activation-milestone-registry-staging-restoration`

Base: `codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference`

Run ID: `registry1-20260612T142645`

## Execution

- Proof-only mode: `false`
- SQL executed: `true`
- Migration deployed: `true`
- Supabase rows written: `false`
- GCS uploaded: `true`

## Approved Staging Target

- Project label: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment: `staging`

## Registry Tables

- `activation_artifacts`: present
- `activation_qa_gates`: present
- `activation_runs`: present
- `feature_gates`: present
- `readiness_snapshots`: present
- `tool_capabilities`: present

## Migration Status

- Migration file: `supabase/migrations/202606040001_activation_milestone_registry.sql`
- Static migration safety: `passed`
- Migration history status: `warning`
- Migration history present: `false`

## RLS And Security

- RLS enabled on all tables: `true`
- Unsafe public/anon/authenticated access: `false`
- Service-role access on all tables: `true`
- Secret payloads printed: `false`

## PostgREST Visibility

- Status: `completed`
- Service-role REST used: `true`
- All tables visible: `true`

## Provider-1 Unblock Status

- Status: `ready_to_rerun_PROVIDER_1_milestone_sync`
- Can rerun Provider-1 milestone sync: `true`
- Next owner: `PROVIDER_GATEWAY_MODELS`

## Artifacts

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/audit/staging-target-reconciliation.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/audit/registry-table-status.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/audit/migration-history-status.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/audit/schema-cache-visibility.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/policy/rls-registry-access-policy-review.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/restore/registry-restore-plan.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/verification/postgrest-registry-visibility.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/handoff/provider1-unblock-handoff.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/registry-restore/registry1-20260612T142645/qa/supabase-registry-restore-qa.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/registry-restore/registry1-20260612T142645/restore/registry-restore-result.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/registry-restore/registry1-20260612T142645/reports/supabase-registry-restore-report.json`

## QA

- QA status: `passed`
- Blockers: `none`
- Mandatory migration-history gate: `warning` accepted for this direct psql restore because all six tables, RLS/security checks, and service-role PostgREST probes passed.

## Validation

- `npm run smoke:activation-supabase-registry-restore`: passed
- `npm run activation:supabase-registry-restore:report`: passed; proof-only/non-mutating report mode
- `npm run activation:supabase-registry-restore:iam-plan || true`: non-blocking missing script on this base
- `npm run activation:supabase-approved-staging-target:report || true`: passed
- `npm run activation:supabase-milestone-sync:report || true`: passed command; static report remains planned/blocked because it does not inspect remote registry tables
- `npm run activation:provider-model-approval-policy:report || true`: non-blocking missing script on this base
- `npm run prod:readiness:summary`: passed command; production readiness remains blocked
- `npm run prod:beta:summary`: passed command; external beta, real user media beta, and paid production remain blocked
- `npm run lint`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `git diff --check`: passed
- `git diff --cached --check`: passed

## Safety Notes

- Secret payload values were resolved only from Google Secret Manager during confirmed execution and were not printed, stored, or written to artifacts.
- The restore applied only `supabase/migrations/202606040001_activation_milestone_registry.sql`; no `db push`, schema reset, unrelated SQL, RLS weakening, broad anon/auth grants, Provider-1 rerun, backfill, production, beta, worker/tool/model, media, or provider execution was performed.
- The April 28, 2026 Supabase Data API exposure change was treated as a visibility risk: service-role-only policy was preserved and visibility was verified through service-role zero-row PostgREST probes rather than broad public grants.

## Provider-1 Handoff

- Exact handoff status: `ready_to_rerun_PROVIDER_1_milestone_sync`
- Cross-chat impact: PR #307 can rerun Provider-1 guarded milestone sync against the restored staging registry tables.

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

Hand back to PROVIDER_GATEWAY_MODELS to rerun Provider-1 milestone sync.
