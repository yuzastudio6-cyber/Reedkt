# Supabase SECURITY DEFINER Function Classification

Classification status: `security_definer_function_classification_planned`.
Supabase update status: docs_only.
SQL executed: none.
Migration deployed: no.
Grant/revoke executed: no.
Function altered: no.

## Classification Rules

- `authenticated_only`: future remediation may preserve authenticated execution only when function body and RLS policy dependencies prove it is required.
- `private_schema_candidate`: future remediation should evaluate whether direct browser/API execute grants should be removed or the function should move to a private schema compatibility path.
- `needs_human_review`: future remediation must not choose a grant/security-mode outcome without accepted body, dependency, and caller evidence.
- `no_anon_direct_execute`: default posture for every function in this packet.
- `service_role_backend_only`: service-role use remains backend-only and must never become browser-visible.

## Function Classification Matrix

| Function | Anon posture | Authenticated posture | Classification | Confidence | Evidence still required |
| --- | --- | --- | --- | --- | --- |
| `has_workspace_role` | Likely no direct execute. | Likely yes only if policy/helper-dependent. | `authenticated_only` | Medium | Body, grants, policy references, route/RPC usage. |
| `is_workspace_owner_or_admin` | Likely no direct execute. | Likely yes only if policy/helper-dependent. | `authenticated_only` | Medium | Body, grants, workspace membership source, policy references. |
| `is_workspace_owner_record` | Likely no direct execute. | Likely yes only if policy/helper-dependent. | `authenticated_only` | Low | Body, inputs, return type, grants, policy references. |
| `set_updated_at` | No direct execute. | No direct execute. | `private_schema_candidate` | High | Trigger dependency, owner, direct execute grants. |
| `can_export_render` | No direct execute. | Unknown until route/body review. | `needs_human_review` | Low | Body, backend route use, approval/render state dependencies, grants. |
| `is_project_editor` | Likely no direct execute. | Likely yes only if policy/helper-dependent. | `authenticated_only` | Medium | Body, grants, project/workspace joins, policy references. |
| `is_project_member` | Likely no direct execute. | Likely yes only if policy/helper-dependent. | `authenticated_only` | Medium | Body, grants, project membership source, RPC exposure. |

## Non-Execution Boundary

Prompt 26G does not revoke grants, grant execute, alter functions, create active SQL, run SQL, mutate Supabase, approve staging, or mark production ready.
