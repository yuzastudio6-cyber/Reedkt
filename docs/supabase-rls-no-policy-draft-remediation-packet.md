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

## Blockers

- Exact table columns and grants need review from accepted redacted evidence or local schema inspection in a future approved prompt.
- Prompt 23 remains `pending_human_approval`.
- Prompt 24D accepted evidence is missing.
- No staging SQL is approved.

## Draft Sketch

Review-only policy sketch: `docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md`.
