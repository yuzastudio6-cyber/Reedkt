# Phase 51A Supabase Data-Plane Audit Results

## Status

Phase 51A adds a read-only Supabase/PostgreSQL data-plane audit. Confirmed completion execution passed for `phase51a-20260604T204225`.

Execution status: completed.

- Static repo audit completed.
- Secret Manager metadata audit completed for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; both secrets exist, both have an enabled version, approved staging service accounts already have secret-level accessor, and no public or broad principals were detected.
- Backend-only Supabase audit credentials were resolved through Google Secret Manager without printing or storing secret values.
- Remote Supabase activity audit completed as count-only checks across 20 target tables.
- Private GCS artifact upload completed under `activation-supabase/phase51a/phase51a-20260604T204225/`.
- StoryTiming RLS triage completed and classified the 11 previously flagged tables as parser false positives: committed dynamic SQL enables RLS and workspace-scoped policies for those tables.
- No migrations, SQL mutations, Supabase lifecycle commands, row writes, secret values, signed URLs, provider calls, media processing, Docker, deployment, production unlock, external beta unlock, paid production unlock, or broad-media unlock occurred.

## Repo Supabase Structure

- Frontend anon client: `src/backend/supabase/supabase-client.ts`.
- Frontend public env config: `src/backend/supabase/supabase-config.ts`.
- Frontend service-role boundary: `src/backend/supabase/supabase-admin-placeholder.ts`.
- Server admin client: `server/supabase/admin-client.ts`.
- Server anon client: `server/supabase/public-client.ts`.
- Runtime env parsing: `server/config/env.ts`.
- Migration SQL: `supabase/migrations/`.

## Remote Activity

Remote activity audit used backend-only credentials from Google Secret Manager and stored only count metadata. It did not store row payloads, auth user dumps, database URLs, service-role values, tokens, headers, or signed URLs.

- Remote audit status: completed.
- Credential source: Google Secret Manager.
- Tables checked: 20.
- Non-zero counted tables: 0.
- Finding: remote target tables counted successfully but appear empty.
- Data-plane gap level: `P1` activity visibility warning, not a P0 blocker.

This explains why Supabase can show little or no recent activity: current activation phases mostly create sanitized docs and private GCS artifacts, while app/runtime paths remain largely mock, contract, fixture, readiness, or audit layers instead of persistent product workflows. The next Supabase phase should add the activation milestone registry so this evidence can be persisted intentionally.

## Secret Metadata

Secret Manager metadata audit completed without reading values during metadata inspection. The runner later resolved values only in memory for the count-only Supabase audit and did not print, store, hash, or upload those values.

- `SUPABASE_URL`: exists, enabled version present, approved staging service-account accessor present, no public principal, no broad group/domain principal.
- `SUPABASE_SERVICE_ROLE_KEY`: exists, enabled version present, approved staging service-account accessor present, no public principal, no broad group/domain principal.
- IAM changes: none required.

## Migration/RLS Findings

- Migration files parsed: 21.
- Parsed public tables: 161.
- RLS-enabled tables parsed after dynamic SQL parsing: 146.
- Remaining P0 data-plane gaps: 0.
- Remaining warnings:
  - Remote target tables counted successfully but appear empty.
  - `supabase/config.toml` is absent in the Phase 50G base, so local Supabase lifecycle readiness is not proven.
  - Repo migration evidence is local/review-ready only; Phase 51A does not prove remote migration application.
  - Process env is still mock-only, but Phase 51A verified backend-only Supabase audit credentials through Secret Manager.

## StoryTiming RLS Triage

The initial Phase 51A static pass flagged the StoryTiming tables because the parser only recognized literal `alter table public.<table> enable row level security` statements. The migration uses a dynamic loop in `supabase/migrations/202605190002_storytiming_master_tables.sql`.

Tables triaged:

- `master_timing_maps`
- `story_timing_segments`
- `timing_anchors`
- `timing_events`
- `timing_dependencies`
- `timing_conflicts`
- `timing_conflict_resolutions`
- `story_timing_qa_checks`
- `render_timing_manifests`
- `render_timing_manifest_tracks`
- `render_timing_manifest_events`

All 11 tables are in `public` schema and store private workspace/project timing data, but the committed migration evidence clears the static flag. Phase 51A did not alter RLS.

- Tables triaged: 11.
- Parser false positives: 11.
- Real StoryTiming P0 RLS blockers: 0.
- Phase51B migration action needed for StoryTiming: no.
- Phase51C action: add local/staging remote RLS smoke only if later runtime evidence finds a real policy issue.

## Artifacts

Generated-assets bucket:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/repo-supabase-file-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/env-secret-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/secret-manager-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/migration-schema-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/rls-security-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/storytiming-rls-triage.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/runtime-integration-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/audit/remote-activity-audit.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/gap-analysis/supabase-data-model-gap-analysis.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-supabase/phase51a/phase51a-20260604T204225/readiness/beta-readiness-impact.json`

QA bucket:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51a/phase51a-20260604T204225/qa/supabase-data-plane-audit-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/phase51a/phase51a-20260604T204225/reports/phase51a-report.json`

## QA

All mandatory gates passed:

- `repo_supabase_discovery`
- `env_secret_audit`
- `migration_schema_audit`
- `rls_security_audit`
- `runtime_integration_audit`
- `remote_activity_audit`
- `data_model_gap_analysis`
- `beta_readiness_impact`
- `storytiming_rls_triage`
- `artifact_privacy`
- `blocked_features`

## Blocked Scope

No migrations, SQL mutations, Supabase lifecycle commands, remote schema changes, row writes, secret printing, signed URL creation, provider calls, media processing, Docker, deployment, production, external beta, paid production, or broad media are enabled.

## Phase51B Readiness

Phase51B readiness: `ready_for_supabase_activation_milestone_registry`.

Phase 51B may proceed as a Supabase activation milestone registry planning phase because backend-only credentials resolved, count-only remote activity audit completed, private GCS upload succeeded, StoryTiming RLS triage cleared the parser false positives, and remaining evidence is a P1 activity-visibility warning rather than a P0 security blocker.

Controlled internal beta remains blocked until later Supabase schema/runtime hardening phases prove real app persistence, approved snapshot writes, job/worker records, artifact records, signed URL audit behavior, RLS smoke coverage, and backend route integration.
