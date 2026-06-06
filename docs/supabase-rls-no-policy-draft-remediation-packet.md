# Supabase RLS No-Policy Draft Remediation Packet

Prompt 26C records draft access models for RLS-enabled tables that Prompt 26A reported as having no policies. No policy is applied in Prompt 26C.

## Status

- Draft status: `draft_only`.
- Advisor remediation applied: no.
- SQL executed: none.
- Active migration created: no.
- Supabase environment touched: none.

## Tables

| Table | Draft access model | Future review need |
| --- | --- | --- |
| `activation_artifacts` | Service-boundary only by default; future read access only if tied to workspace/project activation records. | Confirm owner columns, workspace/project references, and intended user visibility. |
| `activation_qa_gates` | Service-boundary only by default; future read access may be limited to project members if QA gate summaries are user-visible. | Confirm whether this is runtime-internal or customer-facing status. |
| `activation_runs` | Service-boundary only by default; future read access may be project-member scoped if run status is exposed. | Confirm run ownership and lifecycle semantics. |
| `feature_gates` | Read-only authenticated visibility only if values are non-sensitive; otherwise backend/service only. | Confirm whether feature flags expose internal rollout or entitlement data. |
| `readiness_snapshots` | Project/workspace-scoped read model if snapshots are user-visible; write remains service-only. | Confirm canonical workspace/project columns and immutable fields. |
| `tool_capabilities` | Public or authenticated read may be safe only if capability data is static and non-secret; writes remain service-only. | Confirm no tool runtime secrets, provider access, or internal execution state is exposed. |

## Draft Policy Direction

Future remediation should classify each table before writing SQL:

- `deny_all`: RLS remains enabled and no normal user policies are added.
- `project_member_read`: project members can read sanitized rows.
- `workspace_member_read`: workspace members can read sanitized rows.
- `authenticated_static_read`: authenticated users can read non-sensitive static capability metadata.
- `service_role_write_only`: only trusted backend/service-role paths can mutate rows.

## Prompt 26D classification outcome

Prompt 26D records `rls_no_policy_classified` and chooses conservative raw-table models:

| Table | Prompt 26D model | Follow-up |
| --- | --- | --- |
| `activation_artifacts` | `backend_service_role_only` | Future Prompt 26E draft migration plan only. |
| `activation_qa_gates` | `backend_service_role_only` | Future Prompt 26E draft migration plan only. |
| `activation_runs` | `backend_service_role_only` | Future Prompt 26E draft migration plan only. |
| `feature_gates` | `no_client_access` | Future Prompt 26E draft migration plan only. |
| `readiness_snapshots` | `backend_service_role_only` | Future Prompt 26E draft migration plan only. |
| `tool_capabilities` | `no_client_access` | Future Prompt 26E draft migration plan only. |

Prompt 26D is a classification contract only. No RLS policy is applied in Prompt 26D.

## Prompt 26E draft migration plan outcome

Prompt 26E records `rls_no_policy_draft_migration_plan_created` and turns the Prompt 26D classification into draft planning artifacts only:

- Draft migration plan: `docs/supabase-rls-no-policy-draft-migration-plan.md`.
- Future policy names: `docs/supabase-rls-no-policy-policy-naming-contract.md`.
- Dependency matrix: `docs/supabase-rls-no-policy-policy-dependency-matrix.md`.
- Future tests: `docs/supabase-rls-no-policy-future-test-matrix.md`.
- Rollback/cleanup: `docs/supabase-rls-no-policy-rollback-cleanup-plan.md`.
- Staging evidence: `docs/supabase-rls-no-policy-staging-evidence-requirements.md`.

Prompt 26E is a draft migration plan only. No RLS policy is applied in Prompt 26E.

## Blockers

- Exact table columns and grants need review from accepted redacted evidence or local schema inspection in a future approved prompt.
- Prompt 23 remains `pending_human_approval` on this branch.
- Prompt 24D accepted evidence is missing.
- No staging SQL is approved.

## Draft Sketch

Review-only policy sketch: `docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md`.
## Prompt 26E-1 local candidate outcome

Prompt 26E-1 outcome: `local_candidate_prepared`.

The local candidate creates deny-only `anon`/`authenticated` policies for the six classified advisor tables when they exist locally. This is not applied staging remediation, not production remediation, and not advisor clearance.
