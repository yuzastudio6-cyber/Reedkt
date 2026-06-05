# Phase 51B Supabase Milestone Registry Results

Status: partial/blocked after controlled execution.

Run ID: `phase51b-20260605T000541`

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

Secret resolution: completed. Backend-only `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL` resolved from Google Secret
Manager without printing or storing values. The Supabase URL was normalized
from a REST path to the project origin before client creation.

Schema verification: blocked. The stricter zero-row PostgREST probes found
that the six registry tables are not available in the remote schema cache.

Migration status: blocked by `psql` connection failure. The migration is
committed at `supabase/migrations/202606040001_activation_milestone_registry.sql`
and was invoked only after `--apply-migration` plus
`REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true`, but `psql` could not connect
to the configured Supabase DB host on port 5432. No DDL was attempted through
the Supabase REST/service-role client.

Supabase write verification: not attempted. The runner did not write the
milestone bundle because schema verification failed. This is the intended
fail-closed behavior.

Private artifacts:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260605T000541/schema/activation-milestone-schema.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260605T000541/migration/activation-milestone-migration-summary.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260605T000541/bundle/phase51b-milestone-bundle.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51b/phase51b-20260605T000541/backfill/activation-milestone-backfill-plan.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51b/phase51b-20260605T000541/qa/supabase-milestone-registry-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51b/phase51b-20260605T000541/reports/phase51b-report.json`

Blocker:

- Registry tables are missing or unreadable through PostgREST schema cache:
  `activation_runs`, `activation_artifacts`, `activation_qa_gates`,
  `readiness_snapshots`, `tool_capabilities`, and `feature_gates`.
- The configured `SUPABASE_DB_URL` endpoint resolves to an IPv6-only direct
  database host from this environment, and TCP port 5432 refused the `psql`
  connection.

Human action required:

- Provide a backend-only Supabase DB URL that is reachable from this execution
  environment, such as an approved Supabase pooler/session-mode URL if direct
  IPv6 database access is unavailable, or apply the committed migration through
  the approved database migration process and rerun Phase 51B without broadening
  permissions.

Phase51C readiness: blocked until schema verification, one Phase 51B bundle
write/readback, QA, and private artifact upload all pass.

Still blocked: production, external beta, paid production, broad media, public
artifacts, signed URLs as source of truth, raw prompt execution, provider
calls, service-role frontend exposure, and broad historical backfill.
