# Phase 51B Supabase Milestone Registry Results

Status: partial/blocked after controlled execution.

Run ID: `phase51b-20260604T215909`

Phase 51B adds the Supabase activation milestone registry schema, server-only
writer/readers, idempotent bundle upsert path, private GCS report artifacts,
QA gates, and documentation. GCS remains the private artifact store.

Canonical tables:

- `activation_runs`
- `activation_artifacts`
- `activation_qa_gates`
- `readiness_snapshots`
- `tool_capabilities`
- `feature_gates`

Schema verification: blocked. Backend-only Supabase credentials resolved from
Google Secret Manager without printing or storing values, and the Supabase URL
was normalized from a REST path to the project origin before client creation.
The stricter zero-row PostgREST probes found that the six registry tables are
not available in the remote schema cache.

Migration status: blocked by design. The migration is committed at
`supabase/migrations/202606040001_activation_milestone_registry.sql`, but it was
not applied because Phase 51B migration apply requires all of the following:
`--apply-migration`, `REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true`, and a
backend-only direct `SUPABASE_DB_URL` or `DATABASE_URL`. No DDL was attempted
through the Supabase REST/service-role client.

Supabase write verification: not attempted. The runner did not write the
milestone bundle because schema verification failed. This is the intended
fail-closed behavior.

Private artifacts:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260604T215909/schema/activation-milestone-schema.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260604T215909/migration/activation-milestone-migration-summary.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260604T215909/bundle/phase51b-milestone-bundle.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260604T215909/backfill/activation-milestone-backfill-plan.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51b/phase51b-20260604T215909/qa/supabase-milestone-registry-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51b/phase51b-20260604T215909/reports/phase51b-report.json`

Blocker:

- Registry tables are missing or unreadable through PostgREST schema cache:
  `activation_runs`, `activation_artifacts`, `activation_qa_gates`,
  `readiness_snapshots`, `tool_capabilities`, and `feature_gates`.

Human action required:

- Provide a backend-only direct DB URL and explicit migration-apply confirmation
  for a future guarded run, or apply the committed migration through the
  approved database migration process and rerun Phase 51B without broadening
  permissions.

Phase51C readiness: blocked until schema verification, one Phase 51B bundle
write/readback, QA, and private artifact upload all pass.

Still blocked: production, external beta, paid production, broad media, public
artifacts, signed URLs as source of truth, raw prompt execution, provider
calls, service-role frontend exposure, and broad historical backfill.
