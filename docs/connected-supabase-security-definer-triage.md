# Connected Supabase SECURITY DEFINER Triage

The connected read-only audit reported SECURITY DEFINER functions callable by anon or authenticated roles. Prompt 26A records the finding only. It does not revoke grants, alter functions, move schemas, or execute SQL.

## Why This Matters

SECURITY DEFINER functions run with the privileges of the function owner. Broad execute grants can be safe only when the function is intentionally exposed, has narrow inputs, checks caller context, and cannot be used to bypass row-level security or service-role-only boundaries.

## Function Inventory

| Function | Likely purpose | Likely intentional helper? | Risk | Future hardening options | Prompt 26A action |
| --- | --- | --- | --- | --- | --- |
| `has_workspace_role` | workspace role helper | maybe | Broad execute grants may expose role checks or become a policy bypass if body is too permissive. | Review body, revoke public execute if unnecessary, constrain grants, consider SECURITY INVOKER. | record only |
| `is_workspace_owner_or_admin` | workspace ownership/admin helper | maybe | Broad callable helper could leak or bypass workspace role state. | Review body and grants, set search_path in future migration, consider scoped execute. | record only |
| `is_workspace_owner_record` | workspace ownership helper | maybe | Owner checks need precise caller context. | Review body, grants, and policy usage. | record only |
| `set_updated_at` | trigger timestamp helper | likely internal | Trigger helpers usually do not need anon/authenticated execute. | Revoke direct execute if safe and keep trigger behavior. | record only |
| `can_export_render` | render/export readiness helper | maybe | Export readiness checks may expose render/project state. | Review caller checks, grants, and service boundary. | record only |
| `is_project_editor` | project role helper | maybe | Broad callable helper could reveal membership or be used in policy bypass. | Review body, grants, search_path, and policy usage. | record only |
| `is_project_member` | project role helper | maybe | Broad callable helper could reveal membership or be used in policy bypass. | Review body, grants, search_path, and policy usage. | record only |

## Future Review Questions

- Is each function only used inside RLS policies or triggers?
- Does any frontend or public RPC path call it directly?
- Does the function need SECURITY DEFINER, or would SECURITY INVOKER be safer?
- Should execute be revoked from `anon` and/or `authenticated`?
- Should the function move to a private schema or be wrapped by a backend-only route?

## Current Decision

No immediate change is made. Prompt 26B should create a function hardening plan, and a later migration prompt should implement only reviewed changes.

