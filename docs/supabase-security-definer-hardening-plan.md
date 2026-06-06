# Supabase SECURITY DEFINER Hardening Plan

Prompt 26A reported SECURITY DEFINER functions callable by broad roles. Prompt 26B plans a future function-by-function review only. Prompt 26G adds the SECURITY DEFINER exposure migration plan and records `security_definer_exposure_migration_plan_created`; it still applies no remediation.

## Candidate Functions

| Function | Likely role | Primary risk | Future review action | Status |
| --- | --- | --- | --- | --- |
| `has_workspace_role` | workspace role helper | Could expose role state or bypass RLS if overly broad. | Review body, grants, caller checks, and policy usage. | Prompt 26G classification: `authenticated_only`, confidence medium. |
| `is_workspace_owner_or_admin` | workspace owner/admin helper | Broad callable ownership helper may leak workspace membership. | Review body, grants, and SECURITY DEFINER need. | Prompt 26G classification: `authenticated_only`, confidence medium. |
| `is_workspace_owner_record` | workspace ownership helper | Owner checks need precise caller context. | Review whether direct execute is needed. | Prompt 26G classification: `authenticated_only`, confidence low. |
| `set_updated_at` | trigger helper | Trigger helpers usually do not need public execute. | Review grant revocation while preserving trigger behavior. | Prompt 26G classification: `private_schema_candidate`, confidence high. |
| `can_export_render` | render/export readiness helper | Could expose render/project state or readiness. | Review backend route use and grants. | Prompt 26G classification: `needs_human_review`, confidence low. |
| `is_project_editor` | project role helper | Could reveal project membership or bypass policy intent. | Review body, grants, and policy usage. | Prompt 26G classification: `authenticated_only`, confidence medium. |
| `is_project_member` | project role helper | Could reveal membership or become policy bypass. | Review body, grants, and direct RPC exposure. | Prompt 26G classification: `authenticated_only`, confidence medium. |

## Future Hardening Options

- Revoke direct execute from `anon` and/or `authenticated` where not required.
- Keep functions callable only through RLS policy evaluation when safe.
- Convert to SECURITY INVOKER only when body and policy semantics are reviewed.
- Set fixed search path and qualify table references.
- Move helper functions to private schema only with a compatibility plan.

## Prompt 26B Decision

No function, grant, schema, or SECURITY DEFINER setting is changed in Prompt 26B.

## Prompt 26G Decision

Prompt 26G creates `docs/supabase-security-definer-exposure-migration-plan.md`, the related classification/grant/invoker/test/rollback/evidence contracts, and `scripts/validation/supabase-security-definer-migration-plan-diagnostics.mjs`. Status: `security_definer_exposure_migration_plan_created`.

Prompt 26G does not change any function, grant, schema, SECURITY DEFINER setting, policy, migration, Supabase environment, Google Cloud/Secret Manager state, staging approval, production readiness, or beta state.
