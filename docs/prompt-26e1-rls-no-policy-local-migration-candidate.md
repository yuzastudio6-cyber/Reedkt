# Prompt 26E-1 - RLS No-Policy Local Migration Candidate

Prompt 26E-1 converts the Prompt 26E draft plan into a narrow local migration candidate and a catalog-only local SQL test candidate. This is not staging approval, not production readiness, and not a Supabase environment update.

Supabase RLS principle preserved: exposed-schema tables need explicit RLS and role-scoped policy thinking for `anon`, `authenticated`, and backend/service-role behavior. Service-role material must remain backend-only and never browser-safe.

## Status

- Local candidate status: `local_candidate_prepared`.
- Supabase update required: docs/status only.
- Supabase update status: local_candidate_prepared.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Production capability enabled: none; local RLS policy candidate only.

## Candidate Files

- Active local migration candidate: `supabase/migrations/202606060001_rls_no_policy_advisor_remediation.sql`.
- Local catalog-only test candidate: `database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql`.
- Diagnostic: `scripts/validation/supabase-rls-no-policy-local-candidate-diagnostics.mjs`.

## Target Tables

| Table | Prompt 26D model | Local candidate behavior |
| --- | --- | --- |
| `activation_artifacts` | `backend_service_role_only` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |
| `activation_qa_gates` | `backend_service_role_only` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |
| `activation_runs` | `backend_service_role_only` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |
| `feature_gates` | `no_client_access` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |
| `readiness_snapshots` | `backend_service_role_only` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |
| `tool_capabilities` | `no_client_access` | Enable RLS when present and deny `anon`/`authenticated` select/insert/update/delete. |

The migration guards every table with `to_regclass(...)` and raises a notice when a table is absent from the local schema. It does not create table definitions, helper functions, grants, indexes, service-role handlers, positive read policies, or public/authenticated writes.

## Policy Model

Every target table receives four explicit deny policies for `anon` and `authenticated` only:

- SELECT: `using (false)`.
- INSERT: `with check (false)`.
- UPDATE: `using (false) with check (false)`.
- DELETE: `using (false)`.

Backend/service-role access is controlled by backend key handling and future service boundaries. This candidate does not make service-role behavior frontend-visible and does not add grants.

## Local Test Candidate

`database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql` is catalog-only. It uses `begin ... rollback`, fails fast if any of the six tables is absent, verifies RLS is enabled, verifies expected policy names exist, and verifies the policy shape is deny-only for `anon` and `authenticated`.

It intentionally does not insert fixture rows because accepted column/schema evidence for these connected-advisor tables remains incomplete.

## Local Validation Result

Local candidate validation status remains `local_candidate_prepared`. Static diagnostics and foundation validation passed, but the guarded local SQL test did not run because preflight reported `canRunLocalSql=false`.

Current local blockers:

- `supabase_cli_arch_mismatch`
- `docker_daemon_unavailable`
- `local_db_url_missing`

No Supabase lifecycle command, raw `psql`, SQL test, staging/remote/production Supabase action, Google Cloud call, or Secret Manager call was run.

## Cross-Chat Impact

- Owning workstream: `SUPABASE_RLS_STORAGE_DATABASE`.
- Affected workstreams: `WORKER_RUNTIME_JOBS`, `AI_TOOLS_CREATIVE_GRAPHICS`, `OBSERVABILITY_AUDIT_COST`, `COMPLIANCE_SECURITY`, `PROVIDER_GATEWAY`, `RENDER_EXPORT`, `SOUND_MUSIC`, and `MAP_GEOSPATIAL`.
- Handoff: downstream workstreams should assume these raw advisor tables remain unavailable to browser clients unless a later approved policy contract changes the access model.
- Duplicate risk: low; Prompt 26E-1 targets only the six Prompt 26D/26E no-policy advisor tables and uses existing Prompt 26E policy names.

## Remaining Gates

- Local execution requires a verified localhost-only DB URL and `canRunLocalSql=true`.
- Local schema must include all six target tables before the local catalog test can pass.
- Staging execution still requires accepted redacted evidence, Secret Manager reference gates, approved PR/commit/test set, rollback/cleanup owners, and human gate completion.
- Production and beta remain blocked.

## No-Scope Statement

No staging deployment, production deployment, staging/remote Supabase execution, production Supabase execution, remote SQL execution, migration deployment to remote, provider call, real rendering/export, tool execution, real worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, Google Cloud API call, Secret Manager API call, Secret Manager metadata fetch, Secret Manager value fetch, production/beta unlock, schema-changing production migration, dependency mutation, or broad service-role handler is enabled.

## Recommended Next Prompt

- Prompt 26E-2 - RLS No-Policy Local Candidate Validation Fix, if local candidate validation fails or local table evidence is incomplete.
- Prompt 26F - Function Search Path Hardening Migration Plan, if RLS candidate preparation succeeds and function hardening is next priority.
- Prompt 26 - Approved Staging Supabase/RLS Validation Execution only after all approval, evidence, Secret Manager reference, PR/commit/test-set, rollback/cleanup, and final gate requirements pass.
