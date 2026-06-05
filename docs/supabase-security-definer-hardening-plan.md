# Supabase SECURITY DEFINER Hardening Plan

Prompt 26A reported SECURITY DEFINER functions callable by broad roles. Prompt 26B plans a future function-by-function review only.

## Candidate Functions

| Function | Likely role | Primary risk | Future review action | Status |
| --- | --- | --- | --- | --- |
| `has_workspace_role` | workspace role helper | Could expose role state or bypass RLS if overly broad. | Review body, grants, caller checks, and policy usage. | Candidate only. |
| `is_workspace_owner_or_admin` | workspace owner/admin helper | Broad callable ownership helper may leak workspace membership. | Review body, grants, and SECURITY DEFINER need. | Candidate only. |
| `is_workspace_owner_record` | workspace ownership helper | Owner checks need precise caller context. | Review whether direct execute is needed. | Candidate only. |
| `set_updated_at` | trigger helper | Trigger helpers usually do not need public execute. | Review grant revocation while preserving trigger behavior. | Candidate only. |
| `can_export_render` | render/export readiness helper | Could expose render/project state or readiness. | Review backend route use and grants. | Candidate only. |
| `is_project_editor` | project role helper | Could reveal project membership or bypass policy intent. | Review body, grants, and policy usage. | Candidate only. |
| `is_project_member` | project role helper | Could reveal membership or become policy bypass. | Review body, grants, and direct RPC exposure. | Candidate only. |

## Future Hardening Options

- Revoke direct execute from `anon` and/or `authenticated` where not required.
- Keep functions callable only through RLS policy evaluation when safe.
- Convert to SECURITY INVOKER only when body and policy semantics are reviewed.
- Set fixed search path and qualify table references.
- Move helper functions to private schema only with a compatibility plan.

## Prompt 26B Decision

No function, grant, schema, or SECURITY DEFINER setting is changed in Prompt 26B.
