# Supabase RLS No-Policy Access Model Contract

Prompt 26D defines access models for future RLS policy design. These models are contract categories only. No active policy, grant, migration, SQL, or Supabase update is created.

## Status

- Access model contract status: `rls_no_policy_access_models_defined`.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Production capability enabled: none; RLS no-policy classification contract only.

## Access Models

| Model | When to use | Allowed readers | Allowed writers | Service-role behavior | Anon behavior | Authenticated behavior | Frontend visibility | Worker visibility | Audit requirements | Test requirements | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend_service_role_only` | Operational/runtime tables with no proven user read path. | Backend service-role paths only. | Backend service-role paths only. | May read/write only through reviewed backend services. | Denied. | Denied. | None. | Worker/backend only after execution gates. | Record service action, idempotency, actor context if available, and approved snapshot linkage when relevant. | Anon denial, authenticated denial, non-member denial, and documented service-role expectation. | Can hide useful status from users unless paired with safe summary API. |
| `workspace_member_read_backend_write` | Records scoped to a workspace and safe for workspace members to read. | Workspace members through scoped policy. | Backend service-role paths only. | Writes only through reviewed backend services. | Denied. | Allowed only when membership predicate matches. | Read-only scoped status if product requires it. | Worker/backend writes only. | Workspace id, actor, membership basis, and row scope should be auditable. | Positive workspace member read, cross-workspace denial, anon denial, backend write expectation. | Needs reliable workspace column and helper function. |
| `project_member_read_backend_write` | Records scoped to a project and safe for project members to read. | Project members through scoped policy. | Backend service-role paths only. | Writes only through reviewed backend services. | Denied. | Allowed only when project membership predicate matches. | Read-only scoped status if product requires it. | Worker/backend writes only. | Project id, workspace id if present, actor, and row scope should be auditable. | Positive project member read, non-member denial, cross-project denial, anon denial, backend write expectation. | Needs reliable project column, indexes, and helper function. |
| `admin_read_backend_write` | Operational records safe only for admin/operator review. | Human/admin/operator route after future authorization design. | Backend service-role paths only. | Writes only through reviewed backend services. | Denied. | Denied unless future admin role is proven. | None by default. | Worker/backend writes only. | Admin access decision and review action must be recorded. | Anon denial, authenticated non-admin denial, admin read expectation in future approved tests. | ReeditPro admin role model is not fully approved yet. |
| `authenticated_self_scope` | Records owned by one authenticated user and safe only for that user. | The owning authenticated user. | Backend or owner writes only if future design approves. | May read/write for service workflows. | Denied. | Allowed only when row owner equals authenticated subject. | User-scoped only. | Backend only unless worker needs user-owned context. | User id and scope should be auditable. | Owner read, non-owner denial, anon denial, backend write expectation. | Not appropriate for shared workspace/project tables. |
| `no_client_access` | Raw tables that should not be visible directly to frontend clients, even if sanitized summary APIs may exist later. | None through raw table policies. | Backend service-role paths only if table remains active. | May read/write only through reviewed backend services. | Denied. | Denied. | None; future backend summary route required if visible. | Backend/service only. | Any summary exposure must be separately logged and redacted. | Anon denial, authenticated denial, summary route tests if later added. | Developers may mistake no client access for lack of product status visibility. |
| `future_deprecated_blocked` | Tables whose purpose may be obsolete or superseded. | None until review. | None except migration/archive service after future approval. | Blocked except reviewed archival/reconciliation. | Denied. | Denied. | None. | None. | Deprecation decision, migration plan, and rollback must be documented. | Anon denial, authenticated denial, no-write expectation. | A live dependency may still exist; must verify before deprecation. |
| `needs_human_review` | Any table with uncertain sensitivity, scope columns, or ownership. | None until review. | None until review except existing fail-closed backend paths. | Blocked for new use until review. | Denied. | Denied. | None. | None for new flows. | Human reviewer, evidence source, and decision outcome required. | Denial tests plus review completion before migration design. | Overuse can stall progress; underuse can expose sensitive tables. |

## Current Prompt 26D Mapping

| Table | Chosen model |
| --- | --- |
| `activation_artifacts` | `backend_service_role_only` |
| `activation_qa_gates` | `backend_service_role_only` |
| `activation_runs` | `backend_service_role_only` |
| `feature_gates` | `no_client_access` |
| `readiness_snapshots` | `backend_service_role_only` |
| `tool_capabilities` | `no_client_access` |

## Policy Design Rules

- Do not add broad `anon` or `authenticated` access for operational tables.
- Treat service-role access as backend-only and never frontend-visible.
- Prefer backend summary APIs or redacted views over raw-table reads when product status is needed.
- Require local tests before staging, and require human approval plus accepted evidence before staging SQL.
- Secret Manager references remain placeholders only; Prompt 26D does not fetch metadata or values.

