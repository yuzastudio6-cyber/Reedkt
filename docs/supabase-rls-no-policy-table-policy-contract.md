# Supabase RLS No-Policy Table Policy Contract

Prompt 26D defines future policy intent for the six connected-advisor RLS-enabled/no-policy tables. This is not executable SQL and not an active migration.

## Status

- Table policy contract status: `rls_no_policy_table_policy_contract_created`.
- Advisor remediation applied: no.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Active RLS policy migration created: no.

## Policy Intent Matrix

| Table | Chosen policy model | Read policy intent | Insert policy intent | Update policy intent | Delete policy intent | Service-role behavior | Anon behavior | Authenticated behavior | Required joins/helper functions | Required columns | Required indexes | Local test requirement | Staging test requirement | Rollback plan | Owner/handoff workstream |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `activation_artifacts` | `backend_service_role_only` | No raw client read. Future sanitized route only if artifacts are proven safe. | Backend service only. | Backend service only. | Backend service only or future archival path. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future summary route may use project/workspace helpers. | Confirm id, project/workspace/run references, artifact type, sensitivity fields. | Confirm service lookup indexes after schema review. | Anon denial, authenticated denial, non-member denial, service expectation documented. | Repeat denial tests plus service-write evidence only after approval. | Drop future policies and preserve backend-only table if policy design is unsafe. | WORKER_RUNTIME_JOBS; SUPABASE_RLS_STORAGE_DATABASE |
| `activation_qa_gates` | `backend_service_role_only` | No raw client read. Future project status summary only if QA gate fields are redacted. | Backend service only. | Backend service only. | Backend service only. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future gate summary may need project membership helper. | Confirm id, run/project references, gate status, timestamps. | Confirm run/project lookup indexes after schema review. | Anon denial, authenticated denial, non-member denial, service expectation documented. | Repeat denial tests plus future summary contract if added. | Drop future policies and keep gate state backend-only. | WORKER_RUNTIME_JOBS; OBSERVABILITY_AUDIT_COST |
| `activation_runs` | `backend_service_role_only` | No raw client read. Future run status summary only through backend route. | Backend service only. | Backend service only. | Backend service only or future retention path. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future route may need workspace/project membership helper. | Confirm id, workspace/project references, run state, operator/deployment fields. | Confirm run-state and project lookup indexes after schema review. | Anon denial, authenticated denial, non-member denial, service expectation documented. | Repeat denial tests and validate no deployment/operator details leak. | Drop future policies or replace with no-client-access model. | WORKER_RUNTIME_JOBS |
| `feature_gates` | `no_client_access` | No raw client read. Future safe catalog route only if non-sensitive fields are separated. | Backend service only. | Backend service only. | Backend service only. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future summary route may use entitlement/admin checks. | Confirm gate key, rollout state, environment, scope, and sensitive fields. | Confirm gate lookup indexes after schema review. | Anon denial, authenticated denial, no raw read expectation. | Repeat denial tests and verify future summary route if added. | Drop future raw-table policies; preserve backend route-only model. | COMPLIANCE_SECURITY; FRONTEND_PRODUCT_UX |
| `readiness_snapshots` | `backend_service_role_only` | No raw client read. Future redacted readiness view or route only after evidence review. | Backend service only. | Backend service only; immutable fields should remain protected. | Backend service only or future retention path. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future route may need workspace/project helpers and redaction layer. | Confirm id, scope columns, snapshot type, evidence fields, immutable fields. | Confirm scope and created-at indexes after schema review. | Anon denial, authenticated denial, non-member denial, immutability expectation documented. | Repeat denial tests plus redaction evidence before any user-visible readiness path. | Drop future policies and leave snapshots backend-only if redaction is incomplete. | OBSERVABILITY_AUDIT_COST; SUPABASE_RLS_STORAGE_DATABASE |
| `tool_capabilities` | `no_client_access` | No raw client read. Future static catalog may expose only non-secret, non-runtime-enable fields. | Backend service only. | Backend service only. | Backend service only. | Allowed through reviewed backend services only. | Denied. | Denied. | None for raw client access; future catalog route may not need user helper if static and safe. | Confirm tool key, capability fields, runtime flags, provider references, secret absence. | Confirm tool-key indexes after schema review. | Anon denial, authenticated denial, no raw read expectation; future catalog route tests if added. | Repeat denial tests and prove catalog values do not imply runtime enabled. | Drop future raw-table policies; expose catalog through backend route if needed. | AI_TOOLS_CREATIVE_GRAPHICS; TOOL_READINESS |

## Future Migration Requirements

- Every future policy migration must be additive, reviewed, and reversible.
- Every future read policy must include explicit `TO` role targeting.
- `anon` must remain denied for all six raw tables unless a later human-reviewed static catalog design proves otherwise.
- Authenticated users must remain denied from raw tables in the current classification.
- Writes must remain backend/service-role only and must not be exposed through frontend clients.
- Local tests must pass before staging, and staging requires Prompt 23A approval plus accepted Prompt 24D evidence.

